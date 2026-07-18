"use client";

type Props = {
  children: React.ReactNode;
  sheetId: string;
  className?: string;
  title?: string;
  disabled?: boolean;
  variant?: "barcode" | "shipping";
};

const BARCODE_PRINT_CSS = `
  @page { margin: 4mm; size: auto; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #111; font-family: Inter, Arial, sans-serif; }
  .print-root { padding: 0; }
  .barcode-print-sheet {
    --label-width: 50mm;
    --label-height: 25mm;
    --label-gap: 2mm;
    display: grid;
    gap: var(--label-gap);
    grid-template-columns: repeat(auto-fill, minmax(var(--label-width), var(--label-width)));
    align-content: start;
  }
  .barcode-print-sheet[data-size="38x25"] {
    --label-width: 38mm;
    --label-height: 25mm;
  }
  .barcode-print-sheet[data-size="50x25"] {
    --label-width: 50mm;
    --label-height: 25mm;
  }
  .barcode-print-sheet[data-size="60x30"] {
    --label-width: 60mm;
    --label-height: 30mm;
  }
  .barcode-print-card {
    width: var(--label-width);
    height: var(--label-height);
    border: 0.2mm solid #ddd;
    border-radius: 1.4mm;
    display: grid;
    grid-template-rows: auto 1fr auto;
    padding: 1.8mm;
    break-inside: avoid;
    overflow: hidden;
    background: #fff;
    box-shadow: none;
  }
  .barcode-print-head {
    display: grid;
    gap: 0.5mm;
    min-width: 0;
  }
  .barcode-print-title {
    font-size: 2.3mm;
    font-weight: 700;
    line-height: 1.15;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .barcode-print-sku {
    color: #666;
    font-size: 1.8mm;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .barcode-print-code {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    overflow: hidden;
    padding: 0.6mm 0;
  }
  .barcode-print-code svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .barcode-print-foot {
    display: flex;
    justify-content: space-between;
    gap: 1mm;
    font-size: 1.7mm;
    color: #666;
    line-height: 1;
    white-space: nowrap;
  }
`;

const SHIPPING_PRINT_CSS = `
  @page { margin: 4mm; size: auto; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #111; font-family: Inter, Arial, sans-serif; }
  .print-root { padding: 0; }
  .shipping-print-sheet {
    display: grid;
    gap: 3mm;
    grid-template-columns: repeat(auto-fill, minmax(100mm, 100mm));
    align-content: start;
  }
  .shipping-print-card {
    width: 100mm;
    min-height: 150mm;
    border: 0.3mm solid #111;
    border-radius: 2mm;
    display: grid;
    gap: 2.2mm;
    padding: 4mm;
    break-inside: avoid;
    background: #fff;
  }
  .shipping-print-top,
  .shipping-print-meta,
  .shipping-print-bottom {
    display: flex;
    justify-content: space-between;
    gap: 2mm;
    align-items: center;
  }
  .shipping-print-order {
    font-size: 5mm;
    font-weight: 800;
    line-height: 1.1;
  }
  .shipping-print-paid {
    border: 0.3mm solid #111;
    border-radius: 999px;
    font-size: 3.2mm;
    font-weight: 700;
    padding: 0.8mm 2.4mm;
  }
  .shipping-print-name {
    font-size: 6mm;
    font-weight: 800;
    line-height: 1.15;
  }
  .shipping-print-phone {
    font-size: 4.2mm;
    font-weight: 700;
    line-height: 1.2;
  }
  .shipping-print-address {
    display: grid;
    gap: 1.4mm;
    font-size: 4.4mm;
    line-height: 1.32;
    padding: 2mm 0;
    border-top: 0.3mm dashed #999;
    border-bottom: 0.3mm dashed #999;
  }
  .shipping-print-meta,
  .shipping-print-bottom {
    font-size: 3.5mm;
    color: #333;
    line-height: 1.2;
  }
`;

export default function PrintButton({
  children,
  sheetId,
  className,
  title,
  disabled = false,
  variant = "barcode",
}: Props) {
  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        const source = document.getElementById(sheetId);
        if (!source) return;
        const frame = document.createElement("iframe");
        frame.setAttribute("aria-hidden", "true");
        frame.style.position = "fixed";
        frame.style.right = "0";
        frame.style.bottom = "0";
        frame.style.width = "0";
        frame.style.height = "0";
        frame.style.border = "0";
        document.body.appendChild(frame);

        const doc = frame.contentWindow?.document;
        const win = frame.contentWindow;
        if (!doc || !win) {
          frame.remove();
          return;
        }

        doc.open();
        doc.write(`
          <!doctype html>
          <html>
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>${title || "Barcode Labels"}</title>
              <style>${variant === "shipping" ? SHIPPING_PRINT_CSS : BARCODE_PRINT_CSS}</style>
            </head>
            <body>
              <div class="print-root">${source.outerHTML}</div>
            </body>
          </html>
        `);
        doc.close();

        win.focus();
        win.addEventListener(
          "afterprint",
          () => {
            frame.remove();
          },
          { once: true },
        );
        setTimeout(() => {
          win.print();
          setTimeout(() => {
            if (document.body.contains(frame)) frame.remove();
          }, 1500);
        }, 250);
      }}
    >
      {children}
    </button>
  );
}
