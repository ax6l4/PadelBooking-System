import { isDemoMode } from "../../config/demo";

function DemoBanner() {
  if (!isDemoMode) return null;

  return (
    <div className="demo-banner" role="status">
      نسخة تجريبية — البيانات محفوظة محلياً في متصفحك (لا حاجة للخادم)
    </div>
  );
}

export default DemoBanner;
