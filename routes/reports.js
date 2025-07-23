/**
 * Report Generation Routes
 * Handles routes related to report generation, including:
 * - Platform-specific reports
 * - SOC reports
 * - Case reports
 * - Report redirects
 * - PDF generation
 */

const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
const sharp = require('sharp');
const supabase = require('../config/supabase');

// Get report data for preview
router.get('/api/soc/:socId/platform/:platform/report/preview', async (req, res) => {
  try {
    const { socId, platform } = req.params;
    const { caseId } = req.query;
    
    // Validate required parameters
    if (!socId || !platform) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Get data from Supabase
    const { data: socData, error: socError } = await supabase
      .from('socs')
      .select('*')
      .eq('id', socId)
      .single();
      
    if (socError) {
      console.error('Error fetching SOC data:', socError);
      return res.status(404).json({ error: 'SOC not found' });
    }
    
    // Get case data
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();
      
    if (caseError) {
      console.error('Error fetching case data:', caseError);
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Get platform data
    const { data: platformData, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('soc_id', socId)
      .eq('platform_name', platform)
      .single();
      
    if (platformError) {
      console.error('Error fetching platform data:', platformError);
      return res.status(404).json({ error: 'Platform not found' });
    }
    
    // Get photos
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('soc_id', socId)
      .eq('platform', platform)
      .eq('case_id', caseId);
      
    if (photosError) {
      console.error('Error fetching photos:', photosError);
      return res.status(500).json({ error: 'Failed to fetch photos' });
    }
    
    // Format photos data
    const photos = photosData.map(photo => {
      // Parse tags if it's a string
      let tags = photo.tags || [];
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch (e) {
          console.error('Error parsing tags:', e);
          tags = [];
        }
      }
      
      // Parse analysis_tags if it's a string
      let analysisTags = photo.analysis_tags || {};
      if (typeof analysisTags === 'string') {
        try {
          analysisTags = JSON.parse(analysisTags);
        } catch (e) {
          console.error('Error parsing analysis_tags:', e);
          analysisTags = {};
        }
      }
      
      // Parse metadata if it's a string
      let metadata = photo.metadata || {};
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error('Error parsing metadata:', e);
          metadata = {};
        }
      }
      
      return {
        id: photo.id,
        file_path: photo.file_path,
        notes: photo.notes || '',
        tags: tags,
        analysisTags: analysisTags,
        metadata: metadata
      };
    });
    
    // Get threats
    const { data: threatsData, error: threatsError } = await supabase
      .from('threats')
      .select('*')
      .eq('case_id', caseId);
      
    if (threatsError) {
      console.error('Error fetching threats:', threatsError);
      // Continue without threats
    }
    
    // Combine all data
    const data = {
      case: caseData,
      soc: socData,
      platform: platformData,
      photos: photos,
      threats: threatsData || []
    };
    
    res.json(data);
  } catch (error) {
    console.error('Error generating report preview:', error);
    res.status(500).json({ error: 'Failed to generate report preview' });
  }
});

// Generate PDF report for a platform
router.post('/api/soc/:socId/platform/:platform/report/generate', async (req, res) => {
  try {
    const { socId, platform } = req.params;
    const reportData = req.body;
    
    // Validate required data
    if (!reportData || !reportData.case || !reportData.soc) {
      return res.status(400).json({ error: 'Missing required report data' });
    }
    
    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `DTAM_Report_${reportData.case.id}_${timestamp}.pdf`;
    const outputPath = path.join(__dirname, '..', 'public', 'reports', filename);
    
    // Ensure reports directory exists
    await fs.ensureDir(path.join(__dirname, '..', 'public', 'reports'));
    
    // Generate HTML for the report
    const reportHtml = generateReportHtml(reportData);
    
    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for images to load
    await page.setContent(reportHtml, { waitUntil: 'networkidle0' });
    
    // Set PDF options
    const pdfOptions = {
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    };
    
    // Generate PDF
    await page.pdf(pdfOptions);
    
    // Close browser
    await browser.close();
    
    // Return the URL to download the PDF
    const pdfUrl = `/reports/${filename}`;
    res.json({ url: pdfUrl, filename });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// Get platform report data (JSON)
router.get('/api/soc/:socId/platform/:platform/report', async (req, res) => {
  try {
    const { socId, platform } = req.params;
    const { caseId } = req.query;
    
    // Validate required parameters
    if (!socId || !platform) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Get platform data from Supabase
    const { data: platformData, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('soc_id', socId)
      .eq('platform_name', platform)
      .single();
      
    if (platformError) {
      console.error('Error fetching platform data:', platformError);
      return res.status(404).json({ error: 'Platform not found' });
    }
    
    // Get photos for this platform
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('soc_id', socId)
      .eq('platform', platform)
      .eq('case_id', caseId);
      
    if (photosError) {
      console.error('Error fetching photos:', photosError);
      return res.status(500).json({ error: 'Failed to fetch photos' });
    }
    
    // Format photos data
    const photos = photosData.map(photo => {
      // Parse tags if it's a string
      let tags = photo.tags || [];
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch (e) {
          console.error('Error parsing tags:', e);
          tags = [];
        }
      }
      
      // Parse analysis_tags if it's a string
      let analysisTags = photo.analysis_tags || {};
      if (typeof analysisTags === 'string') {
        try {
          analysisTags = JSON.parse(analysisTags);
        } catch (e) {
          console.error('Error parsing analysis_tags:', e);
          analysisTags = {};
        }
      }
      
      // Parse metadata if it's a string
      let metadata = photo.metadata || {};
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error('Error parsing metadata:', e);
          metadata = {};
        }
      }
      
      return {
        id: photo.id,
        file_path: photo.file_path,
        notes: photo.notes || '',
        tags: tags,
        analysisTags: analysisTags,
        metadata: metadata
      };
    });
    
    // Combine platform data with photos
    const result = {
      ...platformData,
      photos: photos
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching platform report data:', error);
    res.status(500).json({ error: 'Failed to fetch platform report data' });
  }
});

// Generate report for the entire case
router.get('/api/case/report', async (req, res) => {
  try {
    const { caseId } = req.query;
    
    if (!caseId) {
      return res.status(400).json({ error: 'Missing case ID parameter' });
    }
    
    // Get case data from Supabase
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();
      
    if (caseError) {
      console.error('Error fetching case data:', caseError);
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Get SOCs for this case
    const { data: socsData, error: socsError } = await supabase
      .from('socs')
      .select('*')
      .eq('case_id', caseId);
      
    if (socsError) {
      console.error('Error fetching SOCs data:', socsError);
      return res.status(500).json({ error: 'Failed to fetch SOCs data' });
    }
    
    // For now, just return the case data with SOCs
    // In the future, this would generate a comprehensive PDF
    res.json({
      case: caseData,
      socs: socsData
    });
  } catch (error) {
    console.error('Error generating case report:', error);
    res.status(500).json({ error: 'Failed to generate case report' });
  }
});

// Redirect from old report endpoint
router.get('/api/platform/:platform/report', async (req, res) => {
  try {
    const platform = req.params.platform;
    const { caseId } = req.query;
    
    if (!caseId) {
      return res.status(400).json({ error: 'Missing case ID parameter' });
    }
    
    // Get SOCs for this case
    const { data: socsData, error: socsError } = await supabase
      .from('socs')
      .select('*')
      .eq('case_id', caseId);
      
    if (socsError || !socsData || socsData.length === 0) {
      console.error('Error fetching SOCs data:', socsError);
      return res.status(404).json({ error: 'No SOCs found for this case' });
    }
    
    // Use the first SOC as the active one
    const activeSocId = socsData[0].id;
    
    res.redirect(`/api/soc/${activeSocId}/platform/${platform}/report?caseId=${caseId}`);
  } catch (error) {
    console.error('Error redirecting to platform report:', error);
    res.status(500).json({ error: 'Failed to redirect to platform report' });
  }
});

// Helper function to generate HTML for the report
function generateReportHtml(data) {
  const { case: caseData, soc, platform, photos = [], threats = [] } = data;
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Generate HTML for photos
  const photosHtml = photos.filter(photo => photo.include !== false)
    .map(photo => {
      const tagsHtml = (photo.tags || [])
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');
        
      const analysisTagsHtml = Object.entries(photo.analysisTags || {})
        .map(([key, value]) => `<span class="analysis-tag">${key}: ${value}</span>`)
        .join('');
        
      return `
        <div class="photo-item">
          <div class="photo-header">
            <h4>Photo ID: ${photo.id}</h4>
          </div>
          <div class="photo-content">
            <div class="photo-image">
              <img src="${photo.file_path}" alt="Photo">
            </div>
            <div class="photo-details">
              <div class="detail-row">
                <span class="detail-label">Platform:</span>
                <span class="detail-value">${platform.platform_name || platform}</span>
              </div>
              ${photo.notes ? `
              <div class="detail-row">
                <span class="detail-label">Notes:</span>
                <span class="detail-value">${photo.notes}</span>
              </div>
              ` : ''}
              ${photo.tags && photo.tags.length > 0 ? `
              <div class="detail-row">
                <span class="detail-label">Tags:</span>
                <div class="tags-container">${tagsHtml}</div>
              </div>
              ` : ''}
              ${photo.analysisTags && Object.keys(photo.analysisTags).length > 0 ? `
              <div class="detail-row">
                <span class="detail-label">Analysis Tags:</span>
                <div class="tags-container">${analysisTagsHtml}</div>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  
  // Generate HTML for threats
  const threatsHtml = threats.filter(threat => threat.include !== false)
    .map(threat => `
      <div class="threat-item">
        <div class="threat-header">
          <h4>Threat ID: ${threat.id}</h4>
        </div>
        <div class="threat-content">
          <div class="detail-row">
            <span class="detail-label">Discovery Method:</span>
            <span class="detail-value">${threat.discovery_method || 'N/A'}</span>
          </div>
          ${threat.content ? `
          <div class="detail-row">
            <span class="detail-label">Content:</span>
            <span class="detail-value">${threat.content}</span>
          </div>
          ` : ''}
          ${threat.language_analysis ? `
          <div class="detail-row">
            <span class="detail-label">Language Analysis:</span>
            <span class="detail-value">${threat.language_analysis}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  
  // Main HTML template
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DTAM Report - Case ${caseData.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .report-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .report-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #007bff;
        }
        .report-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .report-subtitle {
          font-size: 18px;
          color: #666;
        }
        .report-date {
          font-size: 14px;
          color: #666;
          margin-top: 10px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 1px solid #ddd;
        }
        .detail-row {
          margin-bottom: 10px;
        }
        .detail-label {
          font-weight: bold;
          display: inline-block;
          min-width: 150px;
        }
        .detail-value {
          display: inline-block;
        }
        .photo-item, .threat-item {
          margin-bottom: 30px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .photo-header, .threat-header {
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        .photo-content {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }
        .photo-image {
          flex: 0 0 300px;
        }
        .photo-image img {
          max-width: 100%;
          height: auto;
          border: 1px solid #ddd;
        }
        .photo-details {
          flex: 1;
          min-width: 300px;
        }
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 5px;
        }
        .tag, .analysis-tag {
          display: inline-block;
          padding: 3px 8px;
          background-color: #f0f0f0;
          border-radius: 12px;
          font-size: 12px;
        }
        .analysis-tag {
          background-color: #e6f3ff;
          color: #0066cc;
        }
        .page-break {
          page-break-after: always;
        }
        @media print {
          body {
            font-size: 12pt;
          }
          .report-container {
            width: 100%;
            max-width: none;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <div class="report-title">Digital Threat Assessment Manager Report</div>
          <div class="report-subtitle">Case ID: ${caseData.id}</div>
          <div class="report-date">Generated on ${formatDate(new Date().toISOString())}</div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Case Information</h2>
          <div class="detail-row">
            <span class="detail-label">Case ID:</span>
            <span class="detail-value">${caseData.id}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${formatDate(caseData.date)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Investigator:</span>
            <span class="detail-value">${caseData.team_member_name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Organization:</span>
            <span class="detail-value">${caseData.organization || 'N/A'}</span>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Subject of Concern Information</h2>
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${soc.name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Student ID:</span>
            <span class="detail-value">${soc.student_id || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Grade:</span>
            <span class="detail-value">${soc.grade || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">School:</span>
            <span class="detail-value">${soc.school || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">${soc.status ? soc.status.charAt(0).toUpperCase() + soc.status.slice(1) : 'N/A'}</span>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Platform Information</h2>
          <div class="detail-row">
            <span class="detail-label">Platform:</span>
            <span class="detail-value">${platform.platform_name ? platform.platform_name.charAt(0).toUpperCase() + platform.platform_name.slice(1) : (typeof platform === 'string' ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'N/A')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Username:</span>
            <span class="detail-value">${platform.username || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Display Name:</span>
            <span class="detail-value">${platform.display_name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Profile URL:</span>
            <span class="detail-value">${platform.profile_url || 'N/A'}</span>
          </div>
        </div>
        
        ${photos.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Photos and Analysis</h2>
          ${photosHtml}
        </div>
        ` : ''}
        
        ${threats.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Threat Information</h2>
          ${threatsHtml}
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
