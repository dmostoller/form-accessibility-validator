declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: object;
    jsPDF?: object;
  }

  function html2pdf(): {
    from: (element: HTMLElement) => any;
    set: (options: Html2PdfOptions) => any;
    save: () => Promise<void>;
  };

  export default html2pdf;
}