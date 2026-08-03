using System.Text;
using System.Text.Json;

namespace PadelBooking.API.Services;

public class ThawaniService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _http;

    public ThawaniService(IConfiguration config, HttpClient http)
    {
        _config = config;
        _http = http;
    }

    public async Task<(string SessionId, string CheckoutUrl)> CreateSessionAsync(
        decimal amount,
        int bookingId,
        string? customerName)
    {
        var apiKey = _config["Thawani:SecretKey"];
        var baseUrl = _config["Thawani:BaseUrl"] ?? "https://uatcheckout.thawani.om/api/v1";
        var frontendBase = (_config["FRONTEND_URL"] ?? _config["Frontend:BaseUrl"])?.TrimEnd('/')
            ?? "http://localhost:5173";
        var successUrl = _config["Thawani:SuccessUrl"];
        if (string.IsNullOrWhiteSpace(successUrl))
            successUrl = $"{frontendBase}/payment/callback";

        var cancelUrl = _config["Thawani:CancelUrl"];
        if (string.IsNullOrWhiteSpace(cancelUrl))
            cancelUrl = $"{frontendBase}/booking";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            var mockId = Guid.NewGuid().ToString();
            var mockUrl = $"{successUrl}?session={mockId}&bookingId={bookingId}";
            return (mockId, mockUrl);
        }

        var payload = new
        {
            client_reference_id = bookingId.ToString(),
            mode = "payment",
            products = new[]
            {
                new
                {
                    name = "Padel Booking",
                    quantity = 1,
                    unit_amount = (int)(amount * 1000)
                }
            },
            success_url = $"{successUrl}?bookingId={bookingId}",
            cancel_url = cancelUrl,
            metadata = new { customer = customerName ?? "Guest", bookingId }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl.TrimEnd('/')}/checkout/session")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.Add("thawani-api-key", apiKey);

        var response = await _http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new Exception($"Thawani error: {body}");

        using var doc = JsonDocument.Parse(body);
        var data = doc.RootElement.GetProperty("data");
        var sessionId = data.GetProperty("session_id").GetString() ?? "";
        var checkoutUrl = $"https://uatcheckout.thawani.om/pay/{sessionId}?key={_config["Thawani:PublishableKey"]}";

        return (sessionId, checkoutUrl);
    }
}
