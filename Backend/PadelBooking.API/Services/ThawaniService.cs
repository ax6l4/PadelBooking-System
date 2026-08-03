using System.Text;
using System.Text.Json;

namespace PadelBooking.API.Services;

/// <summary>
/// تكامل بوابة ثواني (Thawani E-Commerce API).
/// بيئة الاختبار (UAT): https://uatcheckout.thawani.om/api/v1
/// الوثائق: https://thawani-technologies.stoplight.io/docs/thawani-ecommerce-api
/// </summary>
public class ThawaniService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _http;
    private readonly ILogger<ThawaniService> _logger;

    public ThawaniService(IConfiguration config, HttpClient http, ILogger<ThawaniService> logger)
    {
        _config = config;
        _http = http;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_config["Thawani:SecretKey"]);

    private string ApiBaseUrl =>
        (_config["Thawani:BaseUrl"] ?? "https://uatcheckout.thawani.om/api/v1").TrimEnd('/');

    private string CheckoutHost =>
        (_config["Thawani:CheckoutHost"] ?? "https://uatcheckout.thawani.om").TrimEnd('/');

    private string PublishableKey => _config["Thawani:PublishableKey"] ?? "";

    private string SecretKey => _config["Thawani:SecretKey"] ?? "";

    private string FrontendBase =>
        (_config["FRONTEND_URL"] ?? _config["Frontend:BaseUrl"] ?? "http://localhost:5173")
            .TrimEnd('/');

    public async Task<(string SessionId, string CheckoutUrl)> CreateSessionAsync(
        decimal amountOmr,
        int paymentId,
        int bookingId,
        string? customerName,
        string? customerPhone,
        string? customerEmail)
    {
        var successUrl = string.IsNullOrWhiteSpace(_config["Thawani:SuccessUrl"])
            ? $"{FrontendBase}/payment/callback?paymentId={paymentId}"
            : AppendQuery(_config["Thawani:SuccessUrl"]!, $"paymentId={paymentId}");

        var cancelUrl = string.IsNullOrWhiteSpace(_config["Thawani:CancelUrl"])
            ? $"{FrontendBase}/booking?payment=cancelled"
            : _config["Thawani:CancelUrl"]!;

        // بدون مفتاح: محاكاة محلية للتطوير فقط
        if (!IsConfigured)
        {
            var mockId = $"mock_{Guid.NewGuid():N}";
            var mockUrl = $"{FrontendBase}/payment/thawani-demo?paymentId={paymentId}&session={mockId}&amount={amountOmr}";
            return (mockId, mockUrl);
        }

        // unit_amount بوحدة البيسة (1 ر.ع = 1000)
        var unitAmount = (int)Math.Round(amountOmr * 1000m, MidpointRounding.AwayFromZero);
        if (unitAmount < 100)
            unitAmount = 100; // الحد الأدنى التقريبي للاختبار

        var payload = new Dictionary<string, object?>
        {
            ["client_reference_id"] = paymentId.ToString(),
            ["mode"] = "payment",
            ["products"] = new[]
            {
                new Dictionary<string, object>
                {
                    ["name"] = $"حجز بادل #{bookingId}",
                    ["quantity"] = 1,
                    ["unit_amount"] = unitAmount
                }
            },
            ["success_url"] = successUrl,
            ["cancel_url"] = cancelUrl,
            ["metadata"] = new Dictionary<string, string>
            {
                ["Customer name"] = string.IsNullOrWhiteSpace(customerName) ? "Guest" : customerName!,
                ["customer_name"] = string.IsNullOrWhiteSpace(customerName) ? "Guest" : customerName!,
                ["customer_phone"] = string.IsNullOrWhiteSpace(customerPhone) ? "00000000" : customerPhone!,
                ["customer_email"] = string.IsNullOrWhiteSpace(customerEmail) ? "guest@padel.local" : customerEmail!,
                ["booking_id"] = bookingId.ToString(),
                ["payment_id"] = paymentId.ToString(),
                ["order id"] = paymentId.ToString()
            }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, $"{ApiBaseUrl}/checkout/session")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.TryAddWithoutValidation("thawani-api-key", SecretKey);

        var response = await _http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Thawani create session failed: {Status} {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"فشل إنشاء جلسة الدفع عبر ثواني: {body}");
        }

        using var doc = JsonDocument.Parse(body);
        if (!doc.RootElement.TryGetProperty("data", out var data))
            throw new InvalidOperationException("استجابة ثواني غير متوقعة (لا يوجد data)");

        var sessionId = data.GetProperty("session_id").GetString()
            ?? throw new InvalidOperationException("لم يتم إرجاع session_id من ثواني");

        var checkoutUrl = $"{CheckoutHost}/pay/{sessionId}?key={PublishableKey}";
        return (sessionId, checkoutUrl);
    }

    /// <summary>
    /// جلب حالة الجلسة من ثواني: paid | unpaid | cancelled
    /// </summary>
    public async Task<string> GetPaymentStatusAsync(string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId))
            return "unpaid";

        // جلسات المحاكاة المحلية
        if (sessionId.StartsWith("mock_", StringComparison.OrdinalIgnoreCase))
            return "paid";

        if (!IsConfigured)
            return "paid";

        var request = new HttpRequestMessage(HttpMethod.Get, $"{ApiBaseUrl}/checkout/session/{sessionId}");
        request.Headers.TryAddWithoutValidation("thawani-api-key", SecretKey);

        var response = await _http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Thawani retrieve session failed: {Status} {Body}", response.StatusCode, body);
            throw new InvalidOperationException("تعذر التحقق من حالة الدفع لدى ثواني");
        }

        using var doc = JsonDocument.Parse(body);
        var data = doc.RootElement.GetProperty("data");

        if (data.TryGetProperty("payment_status", out var statusProp))
            return statusProp.GetString()?.ToLowerInvariant() ?? "unpaid";

        if (data.TryGetProperty("status", out var alt))
            return alt.GetString()?.ToLowerInvariant() ?? "unpaid";

        return "unpaid";
    }

    private static string AppendQuery(string url, string query)
    {
        return url.Contains('?') ? $"{url}&{query}" : $"{url}?{query}";
    }
}
