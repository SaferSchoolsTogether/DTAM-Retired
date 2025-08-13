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
const puppeteer = require('puppeteer');
const chromium = require('chrome-aws-lambda');
const sharp = require('sharp');
const supabase = require('../config/supabase');

// Get report data for preview
router.get('/api/soc/:socId/platform/:platform/report/preview', async (req, res) => {
  try {
    const { socId, platform } = req.params;
    const { caseId } = req.query;
    
    // Validate required parameters
    if (!caseId) {
      return res.status(400).json({ error: 'Missing required case ID parameter' });
    }
    
    // Get case data, ensuring it belongs to the current user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .eq('created_by', req.user.id) // Verify user ownership
      .single();
      
    if (caseError) {
      console.error('Error fetching case data:', caseError);
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Get ALL SOCs for this case
    const { data: allSocsData, error: allSocsError } = await supabase
      .from('socs')
      .select('*')
      .eq('case_id', caseId);
      
    if (allSocsError) {
      console.error('Error fetching all SOCs data:', allSocsError);
      return res.status(500).json({ error: 'Failed to fetch SOCs data' });
    }
    
    // Get ALL platforms for all SOCs
    const socIds = allSocsData.map(soc => soc.id);
    const { data: allPlatformsData, error: allPlatformsError } = await supabase
      .from('platforms')
      .select('*')
      .in('soc_id', socIds);
      
    if (allPlatformsError) {
      console.error('Error fetching all platforms data:', allPlatformsError);
      return res.status(500).json({ error: 'Failed to fetch platforms data' });
    }
    
    // Get ALL photos for all SOCs
    const { data: allPhotosData, error: allPhotosError } = await supabase
      .from('photos')
      .select('*')
      .in('soc_id', socIds)
      .eq('case_id', caseId);
      
    if (allPhotosError) {
      console.error('Error fetching all photos:', allPhotosError);
      return res.status(500).json({ error: 'Failed to fetch photos' });
    }
    
    // Get "Unknown Threat Evidence" photos (where soc_id is null but case_id matches)
    const { data: unknownPhotosData, error: unknownPhotosError } = await supabase
      .from('photos')
      .select('*')
      .is('soc_id', null)
      .eq('case_id', caseId);
      
    if (unknownPhotosError) {
      console.error('Error fetching unknown photos:', unknownPhotosError);
      // Continue without unknown photos
    }
    
    // Combine all photos
    const allPhotos = [...(allPhotosData || []), ...(unknownPhotosData || [])];
    
    // Format photos data
    const formattedPhotos = allPhotos.map(photo => {
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
        soc_id: photo.soc_id,
        platform: photo.platform,
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
    
    // Get the current SOC and platform for context (these will be the "active" ones in the UI)
    const currentSoc = allSocsData.find(soc => soc.id === socId) || allSocsData[0];
    const currentPlatform = allPlatformsData.find(p => 
      p.soc_id === socId && p.platform_name === platform
    ) || allPlatformsData.find(p => p.soc_id === socId) || allPlatformsData[0];
    
    // Organize data by SOC and platform
    const socsWithData = allSocsData.map(soc => {
      // Get platforms for this SOC
      const socPlatforms = allPlatformsData.filter(p => p.soc_id === soc.id);
      
      // Get photos for this SOC
      const socPhotos = formattedPhotos.filter(photo => photo.soc_id === soc.id);
      
      // Organize photos by platform
      const photosByPlatform = {};
      socPhotos.forEach(photo => {
        if (!photosByPlatform[photo.platform]) {
          photosByPlatform[photo.platform] = [];
        }
        photosByPlatform[photo.platform].push(photo);
      });
      
      return {
        ...soc,
        platforms: socPlatforms,
        photos: socPhotos,
        photosByPlatform
      };
    });
    
    // Handle unknown photos (no SOC)
    const unknownPhotos = formattedPhotos.filter(photo => !photo.soc_id);
    if (unknownPhotos.length > 0) {
      // Organize unknown photos by platform
      const unknownPhotosByPlatform = {};
      unknownPhotos.forEach(photo => {
        if (!unknownPhotosByPlatform[photo.platform]) {
          unknownPhotosByPlatform[photo.platform] = [];
        }
        unknownPhotosByPlatform[photo.platform].push(photo);
      });
      
      // Add an "Unknown" SOC entry
      socsWithData.push({
        id: 'unknown',
        name: 'Unknown Threat Evidence',
        photos: unknownPhotos,
        photosByPlatform: unknownPhotosByPlatform
      });
    }
    
    // Combine all data
    const data = {
      case: caseData,
      soc: currentSoc, // Keep for backward compatibility
      platform: currentPlatform, // Keep for backward compatibility
      photos: formattedPhotos.filter(p => p.soc_id === socId && p.platform === platform), // Keep for backward compatibility
      threats: threatsData || [],
      allSocs: socsWithData,
      allPlatforms: allPlatformsData,
      allPhotos: formattedPhotos
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
    if (!reportData || !reportData.case) {
      return res.status(400).json({ error: 'Missing required report data' });
    }
    
    // Verify the case belongs to the current user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', reportData.case.id)
      .eq('created_by', req.user.id) // Verify user ownership
      .single();
      
    if (caseError || !caseData) {
      console.error('Case not found or not owned by user:', caseError);
      return res.status(404).json({ error: 'Case not found or you do not have permission to access it' });
    }
    
    // Generate a unique filename for download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `DTAM_Report_${reportData.case.id}_${timestamp}.pdf`;
    
    // Generate HTML for the report
    const reportHtml = generateReportHtml(reportData);
    
    // Launch puppeteer with chrome-aws-lambda for Vercel compatibility
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for images to load
    await page.setContent(reportHtml, { waitUntil: 'networkidle0' });
    
    // Set PDF options - generate to buffer instead of file
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    };
    
    // Generate PDF to buffer
    const pdfBuffer = await page.pdf(pdfOptions);
    
    // Close browser
    await browser.close();
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF buffer directly
    res.send(pdfBuffer);
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
    
    // Verify the case belongs to the current user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('created_by', req.user.id) // Verify user ownership
      .single();
      
    if (caseError || !caseData) {
      console.error('Case not found or not owned by user:', caseError);
      return res.status(404).json({ error: 'Case not found or you do not have permission to access it' });
    }
    
    // Verify the SOC belongs to the case and the case belongs to the current user
    const { data: socData, error: socError } = await supabase
      .from('socs')
      .select('*, cases!inner(created_by)')
      .eq('id', socId)
      .eq('case_id', caseId)
      .eq('cases.created_by', req.user.id) // Verify user ownership via case relationship
      .single();
      
    if (socError || !socData) {
      console.error('SOC not found or not owned by user:', socError);
      return res.status(404).json({ error: 'SOC not found or you do not have permission to access it' });
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
    
    // Get case data from Supabase, ensuring it belongs to the current user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .eq('created_by', req.user.id) // Verify user ownership
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
    
    // Verify the case belongs to the current user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('created_by', req.user.id) // Verify user ownership
      .single();
      
    if (caseError || !caseData) {
      console.error('Case not found or not owned by user:', caseError);
      return res.status(404).json({ error: 'Case not found or you do not have permission to access it' });
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
  const { case: caseData, allSocs = [], threats = [] } = data;
  
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
  
  // Format time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Generate HTML for a single photo
  const generatePhotoHtml = (photo, platformName) => {
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
              <span class="detail-value">${platformName}</span>
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
  };
  
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
  
  // Generate HTML for each SOC and its platforms
  const socsHtml = (data.allSocs || []).map(soc => {
    // Generate platform sections for this SOC
    const platformSections = Object.entries(soc.photosByPlatform || {}).map(([platformName, photos]) => {
      // Find platform details if available
      const platformDetails = (data.allPlatforms || []).find(p => 
        p.soc_id === soc.id && p.platform_name === platformName
      );
      
      // Generate platform info section
      const platformInfoHtml = platformDetails ? `
        <div class="platform-info">
          <div class="detail-row">
            <span class="detail-label">Username:</span>
            <span class="detail-value">${platformDetails.username || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Display Name:</span>
            <span class="detail-value">${platformDetails.display_name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Profile URL:</span>
            <span class="detail-value">${platformDetails.profile_url || 'N/A'}</span>
          </div>
        </div>
      ` : '';
      
      // Generate photos HTML for this platform
      const platformPhotosHtml = photos
        .filter(photo => photo.include !== false)
        .map(photo => generatePhotoHtml(photo, platformName))
        .join('');
      
      return `
        <div class="platform-section">
          <h3 class="platform-title">${platformName.charAt(0).toUpperCase() + platformName.slice(1)}</h3>
          ${platformInfoHtml}
          ${platformPhotosHtml ? `
            <div class="platform-photos">
              ${platformPhotosHtml}
            </div>
          ` : '<p>No photos found for this platform.</p>'}
        </div>
      `;
    }).join('');
    
    // Return the complete SOC section
    return `
      <div class="soc-section">
        <h2 class="section-title">Subject of Concern: ${soc.name || 'Unknown'}</h2>
        <div class="soc-info">
          <div class="soc-details-grid">
            <div class="detail-row">
              <span class="detail-label">Student Name:</span>
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
              <span class="detail-value status-${soc.status || 'unknown'}">${soc.status ? soc.status.charAt(0).toUpperCase() + soc.status.slice(1) : 'N/A'}</span>
            </div>
            ${soc.dob ? `
            <div class="detail-row">
              <span class="detail-label">Date of Birth:</span>
              <span class="detail-value">${formatDate(soc.dob)}</span>
            </div>
            ` : ''}
            ${soc.support_plans && Array.isArray(soc.support_plans) && soc.support_plans.length > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Support Plans:</span>
              <span class="detail-value">${soc.support_plans.join(', ')}</span>
            </div>
            ` : ''}
            ${soc.other_plan_text ? `
            <div class="detail-row">
              <span class="detail-label">Other Plan Details:</span>
              <span class="detail-value">${soc.other_plan_text}</span>
            </div>
            ` : ''}
          </div>
        </div>
        ${platformSections ? `
          <div class="platforms-container">
            ${platformSections}
          </div>
        ` : '<p>No platforms found for this Subject of Concern.</p>'}
      </div>
    `;
  }).join('<div class="page-break"></div>');
  
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
        .soc-section {
          margin-bottom: 40px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
        }
        .platform-section {
          margin: 20px 0;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        .platform-title {
          font-size: 18px;
          color: #007bff;
          margin-bottom: 15px;
        }
        .platform-info {
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        .case-details-grid, .soc-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .case-id {
          font-weight: bold;
          color: #007bff;
        }
        .status-known {
          color: #28a745;
          font-weight: bold;
        }
        .status-potential {
          color: #ffc107;
          font-weight: bold;
        }
        .status-unknown {
          color: #6c757d;
          font-weight: bold;
        }
        .soc-info {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
          border-left: 4px solid #007bff;
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
          .case-details-grid, .soc-details-grid {
            grid-template-columns: 1fr;
            gap: 10px;
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
          <div class="case-details-grid">
            <div class="detail-row">
              <span class="detail-label">Case ID:</span>
              <span class="detail-value case-id">${caseData.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Case Date:</span>
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
            <div class="detail-row">
              <span class="detail-label">Report Generated:</span>
              <span class="detail-value">${formatDateTime(new Date().toISOString())}</span>
            </div>
            ${caseData.created_at ? `
            <div class="detail-row">
              <span class="detail-label">Case Created:</span>
              <span class="detail-value">${formatDateTime(caseData.created_at)}</span>
            </div>
            ` : ''}
          </div>
        </div>
        
        <!-- All SOCs with their platforms and photos -->
        ${socsHtml}
        
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
