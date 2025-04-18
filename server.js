// server.js
const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');
const next = require('next');
const compression = require('compression');

// Maintenance mode flag - set to false to disable maintenance mode
const MAINTENANCE_MODE = false;

// Create the Next.js app with dev mode setting
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Maintenance page HTML content
const maintenanceHTML = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bakım Arası</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Poppins', 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #e3f2fd, #bbdefb);
            color: #333;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            text-align: center;
        }
        .maintenance-container {
            background-color: white;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            padding: 50px 40px;
            max-width: 650px;
            width: 92%;
            position: relative;
            overflow: hidden;
        }
        .top-accent {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #1565C0, #42a5f5);
        }
        h1 {
            color: #1565C0;
            margin: 20px 0;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .icon-container {
            margin: 30px auto;
            width: 120px;
            height: 120px;
            background: #e3f2fd;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 16px rgba(66, 165, 245, 0.2);
            position: relative;
            animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-10px) rotate(3deg); }
            50% { transform: translateY(0) rotate(0deg); }
            75% { transform: translateY(-5px) rotate(-3deg); }
        }
        .icon {
            font-size: 60px;
        }
        .icon-bg {
            position: absolute;
            width: 160px;
            height: 160px;
            background: radial-gradient(circle, rgba(66, 165, 245, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
            border-radius: 50%;
            z-index: -1;
        }
        p {
            font-size: 18px;
            line-height: 1.7;
            margin-bottom: 25px;
            color: #37474F;
            font-weight: 400;
        }
        .highlight {
            font-weight: 600;
            color: #1565C0;
        }
        .progress-container {
            width: 100%;
            background-color: #f0f0f0;
            border-radius: 12px;
            margin: 30px 0;
            height: 10px;
            overflow: hidden;
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
            position: relative;
        }
        .progress-bar {
            height: 100%;
            width: 23%;
            background: linear-gradient(90deg, #1565C0, #29B6F6);
            border-radius: 12px;
            position: relative;
            overflow: hidden;
        }
        .progress-bar::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, 
                        rgba(255,255,255,0) 0%, 
                        rgba(255,255,255,0.4) 50%, 
                        rgba(255,255,255,0) 100%);
            transform: translateX(-100%);
            animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
            100% {
                transform: translateX(100%);
            }
        }
        .contact {
            margin-top: 35px;
            padding: 20px;
            background-color: #f5f9ff;
            border-radius: 12px;
            border-left: 4px solid #42a5f5;
        }
        .contact p {
            margin-bottom: 0;
            font-size: 16px;
        }
        .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #78909C;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 20px;
            border-top: 1px solid #e1e5eb;
        }
        .date {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .gears {
            position: absolute;
            top: 20px;
            right: 20px;
            opacity: 0.1;
            font-size: 30px;
            transform: rotate(45deg);
        }
        .bottom-decoration {
            position: absolute;
            bottom: -10px;
            left: -10px;
            right: -10px;
            height: 20px;
            background: repeating-linear-gradient(
                45deg,
                #1565C0,
                #1565C0 10px,
                #42a5f5 10px,
                #42a5f5 20px
            );
            opacity: 0.1;
        }
    </style>
</head>
<body>
    <div class="maintenance-container">
        <div class="top-accent"></div>
        <div class="gears">⚙️ ⚙️</div>
        
        <div class="icon-container">
            <div class="icon">🛠️</div>
            <div class="icon-bg"></div>
        </div>
        
        <h1>Bu Site Şu Anda Bakımda</h1>
        
        <p>Daha iyi bir kullanıcı deneyimi sunmak için gerekli sistem güncellemeleri ve bakım çalışması yapılmaktadır. Çalışmalar sırasında sisteme erişiminiz geçici olarak kısıtlanmıştır.</p>
        
        <div class="progress-container">
            <div class="progress-bar"></div>
        </div>
        
        <p>Çalışmalar tamamlandığında sistem otomatik olarak tekrar erişime açılacaktır.</p>
        
        <div class="contact">
            <p>Acil bir durum olduğunda lütfen sistem yöneticisi ile iletişime geçiniz.</p>
        </div>
        
        <div class="bottom-decoration"></div>
    </div>
</body>
</html>`;

// Initialize the Next.js app
app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname, query } = parsedUrl;
    
    // Apply compression to all responses
    compression()(req, res, () => {
      // Check for maintenance mode
      if (MAINTENANCE_MODE) {
        console.log(`Maintenance mode active - intercepting request for: ${pathname}`);
        
        // Set headers to prevent caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        
        // Set status code and content type
        res.statusCode = 503; // Service Unavailable
        res.setHeader('Content-Type', 'text/html');
        
        // Serve maintenance content
        res.write(maintenanceHTML);
        res.end();
        return;
      }
      
      // Handle specific routes
      
      // Handle redirect from /TeiasWebTools/_Layout.html to /_Layout.html
      if (pathname === '/TeiasWebTools/_Layout.html') {
        res.writeHead(302, { Location: '/_Layout.html' });
        res.end();
        return;
      }
      
      // Handle PDFs specially
      if (pathname.endsWith('.pdf')) {
        const filePath = path.join(__dirname, 'public', pathname);
        try {
          const fileContent = fs.readFileSync(filePath);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline');
          res.end(fileContent);
          return;
        } catch (err) {
          // Fall through to Next.js handling if file not found
          console.error(`Error serving PDF: ${err.message}`);
        }
      }
      
      // Handle default route
      if (pathname === '/' && !query.originalUrl) {
        try {
          const loginHtml = path.join(__dirname, 'public', 'login.html');
          if (fs.existsSync(loginHtml)) {
            const content = fs.readFileSync(loginHtml, 'utf8');
            res.setHeader('Content-Type', 'text/html');
            res.end(content);
            return;
          }
        } catch (err) {
          console.error(`Error serving login.html: ${err.message}`);
          // Fall through to Next.js handling
        }
      }
      
      // For everything else, let Next.js handle it
      handle(req, res, parsedUrl);
    });
  });

  // Start the server
  const PORT = process.env.PORT || 5500;
  const HOST = process.env.HOST || '0.0.0.0'; // Changed from '0.0.0.0' to 'localhost' for better HMR
  
  server.listen(PORT, HOST, (err) => {
    if (err) throw err;
    console.log(`Server running at http://${HOST}:${PORT}/`);
    console.log(`MAINTENANCE MODE: ${MAINTENANCE_MODE ? 'ENABLED' : 'DISABLED'}`);
    console.log(`Hot Reloading: ${dev ? 'ENABLED' : 'DISABLED'}`);
    console.log(`Press Ctrl+C to stop the server.`);
  });
});