"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "#f5f2ea",
            color: "#173f2b",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: 560,
              border: "1px solid #d8c8a5",
              borderRadius: 12,
              background: "#fffdf8",
              padding: 28,
              boxShadow: "0 24px 70px rgba(7,54,36,0.14)",
            }}
          >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#806f4d" }}>
              Incident critique
            </p>
            <h1 style={{ margin: "10px 0 0", fontSize: 32 }}>L’application n’a pas pu charger cette page</h1>
            <p style={{ margin: "14px 0 0", lineHeight: 1.65, color: "#66736c" }}>
              Un problème temporaire est survenu. Vous pouvez réessayer sans exposer de détails techniques.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 24,
                border: 0,
                borderRadius: 8,
                background: "#236245",
                color: "white",
                padding: "11px 18px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Réessayer
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
