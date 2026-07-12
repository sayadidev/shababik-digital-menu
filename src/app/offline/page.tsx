"use client";

export default function OfflinePage() {
  return (
    <html lang="ar" dir="rtl" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>غير متصل - شبابيك</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F3EDE4",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
          gap: "24px",
        }}
      >
        <img
          src="/shababik-solid-logo.png"
          alt="Shababik"
          style={{
            width: "120px",
            height: "auto",
            opacity: 0.9,
          }}
        />

        <div
          style={{
            textAlign: "center",
            maxWidth: "320px",
          }}
        >
          <p
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#3B2818",
              margin: "0 0 8px",
              lineHeight: 1.5,
            }}
          >
            يبدو أنك غير متصل بالإنترنت.
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "#8C6B4A",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            يرجى التحقق من اتصال الواي فاي للعودة إلى قائمة شبابيك.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            minWidth: "160px",
            minHeight: "48px",
            padding: "12px 32px",
            backgroundColor: "#5A4A3A",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          إعادة المحاولة
        </button>
      </body>
    </html>
  );
}
