class CertificateHtmlService {
  /**
   * Generate a professional certificate HTML
   * @param {Object} certificateData - Certificate data object
   * @param {Object} certificateData.user - User object with name, email
   * @param {Object} certificateData.course - Course object with title
   * @param {string} certificateData.certificateNumber - Unique certificate number
   * @param {number} certificateData.finalScore - Final score achieved
   * @param {Date} certificateData.issuedDate - Date issued
   * @returns {string} HTML string
   */
  static generateCertificate(certificateData) {
    const { 
      user, 
      course, 
      certificateNumber, 
      finalScore, 
      averageScore,
      quizzesAttempted,
      issuedDate 
    } = certificateData;

    const issueDate = issuedDate
      ? new Date(issuedDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Completion - ${user.name}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Roboto:wght@300;400;500;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .certificate-container {
            background: white;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            max-width: 1000px;
            width: 100%;
            position: relative;
            overflow: hidden;
        }

        .certificate-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #d4af37 0%, #f4e878 50%, #d4af37 100%);
        }

        .certificate-container::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #d4af37 0%, #f4e878 50%, #d4af37 100%);
        }

        .ornamental-border {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 3px solid #d4af37;
            border-radius: 15px;
            pointer-events: none;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            position: relative;
            z-index: 1;
        }

        .logo-section {
            margin-bottom: 30px;
        }

        .logo-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.8rem;
            font-weight: 700;
            color: #1a3a52;
            margin-bottom: 8px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .logo-subtitle {
            font-size: 1.1rem;
            color: #666;
            font-weight: 300;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .certificate-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.2rem;
            color: #d4af37;
            font-weight: 400;
            margin-bottom: 20px;
            letter-spacing: 1px;
        }

        .awarded-to {
            font-size: 1rem;
            color: #333;
            margin-bottom: 15px;
            font-style: italic;
        }

        .student-name {
            font-family: 'Playfair Display', serif;
            font-size: 3.2rem;
            color: #1a3a52;
            font-weight: 700;
            margin-bottom: 30px;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        }

        .achievement-text {
            font-size: 1.1rem;
            color: #333;
            margin-bottom: 25px;
            line-height: 1.6;
        }

        .course-name {
            font-family: 'Playfair Display', serif;
            font-size: 2rem;
            color: #d4af37;
            font-weight: 700;
            margin-bottom: 40px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        }

        .details-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin: 40px 0;
            padding: 30px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            border: 1px solid #dee2e6;
        }

        .detail-item {
            text-align: center;
        }

        .detail-label {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 8px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .detail-value {
            font-size: 1.4rem;
            font-weight: 700;
            color: #1a3a52;
        }

        .score-value {
            color: #27ae60;
            font-size: 1.6rem;
        }

        .signatures-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            margin-top: 60px;
            padding-top: 40px;
            border-top: 2px solid #dee2e6;
        }

        .signature-block {
            text-align: center;
        }

        .signature-line {
            height: 2px;
            background: #333;
            margin-bottom: 10px;
            width: 200px;
            margin-left: auto;
            margin-right: auto;
        }

        .signature-title {
            font-size: 0.9rem;
            color: #666;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
        }

        .footer-text {
            font-size: 0.85rem;
            color: #8B7355;
            font-style: italic;
            margin-bottom: 15px;
        }

        .certificate-id {
            font-size: 0.8rem;
            color: #999;
            font-weight: 500;
            letter-spacing: 1px;
        }

        .decorative-element {
            position: absolute;
            width: 60px;
            height: 60px;
            background: radial-gradient(circle, #d4af37 0%, #f4e878 70%);
            border-radius: 50%;
            opacity: 0.1;
        }

        .decorative-element:nth-child(1) {
            top: 30px;
            left: 30px;
        }

        .decorative-element:nth-child(2) {
            top: 30px;
            right: 30px;
        }

        .decorative-element:nth-child(3) {
            bottom: 30px;
            left: 30px;
        }

        .decorative-element:nth-child(4) {
            bottom: 30px;
            right: 30px;
        }

        /* Print Styles */
        @media print {
            body {
                background: white;
                padding: 0;
                margin: 0;
            }

            .certificate-container {
                box-shadow: none;
                border-radius: 0;
                padding: 40px;
                max-width: none;
                width: 100%;
                margin: 0;
            }

            .details-section {
                background: white;
                border: 2px solid #dee2e6;
            }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .certificate-container {
                padding: 30px 20px;
            }

            .logo-title {
                font-size: 2rem;
            }

            .student-name {
                font-size: 2.2rem;
            }

            .course-name {
                font-size: 1.5rem;
            }

            .details-section {
                grid-template-columns: 1fr;
                gap: 20px;
                padding: 20px;
            }

            .signatures-section {
                grid-template-columns: 1fr;
                gap: 30px;
            }
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="decorative-element"></div>
        <div class="decorative-element"></div>
        <div class="decorative-element"></div>
        <div class="decorative-element"></div>
        <div class="ornamental-border"></div>

        <div class="header">
            <div class="logo-section">
                <h1 class="logo-title">LearnCode AI</h1>
                <p class="logo-subtitle">Learning Platform</p>
            </div>

            <h2 class="certificate-title">Certificate of Completion</h2>
            <p class="awarded-to">This certifies that</p>
            <h3 class="student-name">${user.name}</h3>
            <p class="achievement-text">
                has successfully completed and demonstrated mastery of
            </p>
            <h4 class="course-name">${course.title}</h4>
        </div>

        <div class="details-section">
            <div class="detail-item">
                <div class="detail-label">Final Score</div>
                <div class="detail-value score-value">${finalScore}%</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Average Score</div>
                <div class="detail-value score-value">${averageScore || finalScore}%</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Completion Date</div>
                <div class="detail-value">${issueDate}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Assessments Completed</div>
                <div class="detail-value">${quizzesAttempted || 1}</div>
            </div>
        </div>

        <div class="signatures-section">
            <div class="signature-block">
                <div class="signature-line"></div>
                <p class="signature-title">Course Instructor</p>
            </div>
            <div class="signature-block">
                <div class="signature-line"></div>
                <p class="signature-title">LearnCode AI Director</p>
            </div>
        </div>

        <div class="footer">
            <p class="footer-text">
                Verified Achievement • Authenticated Completion • Excellence Recognized
            </p>
            <p class="certificate-id">Certificate ID: ${certificateNumber}</p>
        </div>
    </div>

    <script>
        // Auto-print functionality
        window.onload = function() {
            // Focus the window first
            window.focus();
            
            // Small delay to ensure everything is loaded
            setTimeout(() => {
                try {
                    window.print();
                } catch (e) {
                    console.log('Auto-print failed, user can manually print');
                }
            }, 500);
        };

        // Keyboard shortcut for printing
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
        });
    </script>
</body>
</html>`;
  }
}

export default CertificateHtmlService;
