namespace PadelBooking.API.Models;

public class User
{
    public int Id { get; set; }


    // الاسم
    public string Name { get; set; } = string.Empty;


    // البريد الإلكتروني
    public string Email { get; set; } = string.Empty;


    // رقم الهاتف
    public string Phone { get; set; } = string.Empty;


    // كلمة المرور
    public string Password { get; set; } = string.Empty;


    // نوع المستخدم
    public UserRole Role { get; set; }


    // تاريخ إنشاء الحساب
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}



public enum UserRole
{
    Customer,
    Admin
}