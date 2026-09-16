// Tự động tạo Favicon hình chú chim Flappy Phuong sắc nét và gán vào tab trình duyệt
export function initBirdFavicon() {
  const img = new Image();
  img.src = './flappy-face.jpg';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Đuôi chim
    ctx.beginPath();
    ctx.moveTo(12, 28);
    ctx.lineTo(2, 21);
    ctx.lineTo(5, 31);
    ctx.lineTo(2, 41);
    ctx.lineTo(12, 35);
    ctx.closePath();
    ctx.fillStyle = '#d97706';
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Thân chim vàng mập
    ctx.beginPath();
    ctx.ellipse(27, 34, 19, 14, 0, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(10, 48, 44, 20);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.5, '#facc15');
    grad.addColorStop(1, '#fef08a');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Bụng chim
    ctx.beginPath();
    ctx.ellipse(27, 38, 12, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fef9c3';
    ctx.fill();

    // 4. Cánh chim
    ctx.save();
    ctx.translate(21, 33);
    ctx.rotate(-0.25);
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 5. ĐẦU CHIM: Cắt tròn khuôn mặt phồng má thổi bong bóng
    ctx.save();
    ctx.beginPath();
    ctx.arc(43, 22, 17, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, 120, 120, 43 - 17, 22 - 17, 34, 34);
    ctx.restore();

    // 6. Viền vàng bảo vệ quanh đầu
    ctx.beginPath();
    ctx.arc(43, 22, 17, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 7. Gán DataURL vào thẻ favicon của trình duyệt
    const dataUrl = canvas.toDataURL('image/png');
    let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = dataUrl;
  };
}
