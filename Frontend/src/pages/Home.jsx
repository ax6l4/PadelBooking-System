import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import CourtsBrowse from "../components/CourtsBrowse";

function Home() {
  return (
    <div className="page">
      <Navbar variant="hero" />
      <Hero />

      <section className="courts-section" id="courts">
        <div className="container">
          <h2>الملاعب</h2>
          <p>ملاعب بادل احترافية مجهزة بالكامل — احجز وقتك المناسب الآن</p>
          <CourtsBrowse />
          <div className="info-cards">
            <div className="info-card">ملاعب داخلية مكيفة</div>
            <div className="info-card">إضاءة احترافية</div>
            <div className="info-card">متاحة طوال الأسبوع</div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
