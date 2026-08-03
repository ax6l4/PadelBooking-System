import { Link } from "react-router-dom";
import badelImage from "../../assets/images/Badel.jpeg";

function Hero() {
  return (
    <section className="hero">
      <img
        src={badelImage}
        className="hero-image"
        alt="لاعب بادل"
        width="1920"
        height="1080"
        decoding="async"
      />
      <div className="hero-overlay" />

      <div className="hero-content">
        <h1>
          احجز ملعبك
          <br />
          <span>بسهولة وسرعة</span>
        </h1>

        <p className="hero-text">
          احجز ملعب البادل الخاص بك في الوقت المناسب
        </p>

        <div className="hero-actions">
          <Link to="/booking" className="btn btn-primary">
            احجز الآن
          </Link>
          <Link to="/login" className="btn btn-outline">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;
