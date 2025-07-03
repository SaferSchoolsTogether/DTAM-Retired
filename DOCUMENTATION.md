# Digital Threat Assessment Management (DTAM)

## Overview

The Digital Threat Assessment Management (DTAM) tool is a specialized application designed for authorized professionals in the field of threat assessment and school safety. It provides a structured environment for analyzing and documenting social media content across multiple platforms as part of digital threat assessments.

### Purpose

- Facilitate systematic analysis of social media content for threat assessment
- Provide a secure workspace for documenting findings and observations
- Enable structured assessment workflows across multiple social platforms
- Support evidence collection and report generation for threat assessment cases

### Target Users

- Trained threat assessment professionals
- School safety personnel
- Authorized investigators with appropriate certification
- Digital threat assessment specialists

## Technical Architecture

### Backend Infrastructure

- **Server**: Express.js application (v5.1.0)
- **Template Engine**: EJS (v3.1.10)
- **File Handling**: 
  - fs-extra for enhanced file operations
  - multer for handling file uploads
- **Logging**: Morgan for HTTP request logging
- **Unique Identifiers**: UUID generation for photos and resources

### Data Storage

- File-based storage system using JSON
- Structured data stored in `data/app-data.json`
- Photo uploads organized by platform in `public/uploads/[platform]`
- Separate directories for each supported social media platform

### API Endpoints

#### Platform Management
- `GET /api/platform/:platform` - Retrieve platform data
- `POST /api/platform/:platform` - Update platform information
- `GET /api/platform/:platform/report` - Generate platform report

#### Photo Management
- `POST /api/platform/:platform/upload` - Upload new photos
- `GET /api/platform/:platform/photo/:photoId` - Retrieve photo data
- `PUT /api/platform/:platform/photo/:photoId` - Update photo metadata
- `DELETE /api/platform/:platform/photo/:photoId` - Remove photo

#### Session Management
- `POST /api/clear-session` - Reset application state

## Core Features

### Multi-Platform Support

The application supports analysis across five major social media platforms:
- Instagram
- Facebook
- Twitter
- TikTok
- YouTube

For each platform, the system tracks:
- Username
- Display Name
- Profile URL
- Associated photos and media
- Platform-specific analysis tags

### Photo Management

#### Upload Capabilities
- Multiple file upload support
- Drag-and-drop interface
- Automatic thumbnail generation
- File type validation (jpg, jpeg, png, gif)

#### Photo Analysis Tools
- Zoom functionality
- Annotation capabilities
- Analytics tracking
- Tag management system

### Analysis Framework

#### Assessment Categories
1. **Baseline Behavior Analysis**
   - Track digital behavioral patterns
   - Identify significant changes
   - Document baseline shifts

2. **Content Authenticity**
   - Photo verification tools
   - Manipulation detection
   - Source verification

3. **Threat Behavior Assessment**
   - Behavioral indicators tracking
   - Concern level classification
   - Escalation monitoring

4. **Privacy and Access**
   - Account status tracking
   - Access level documentation
   - Privacy setting implications

### Documentation Tools

#### Tagging System
- Custom tag creation
- Predefined analysis tags
- Tag categorization
- Tag filtering and search

#### Notes Management
- Per-photo note taking
- Rich text support
- Automatic saving
- Version tracking

## User Workflows

### 1. Onboarding Process

1. Welcome Screen
   - Terms and agreement
   - Authorization verification
   - Access control

2. Case Setup
   - SOC status documentation
   - Case information entry
   - Discovery method recording
   - Safety assessment initialization

### 2. Platform Analysis

1. Platform Selection
   - Quick platform switching
   - Progress tracking per platform
   - Status indicators

2. Content Analysis
   - Photo upload and organization
   - Systematic analysis tools
   - Tag and note application
   - Progress tracking

3. Report Generation
   - Progress saving
   - Report preview
   - Final report generation

## Data Structure

### Platform Data Model
```json
{
  "platforms": {
    "[platform_name]": {
      "username": "string",
      "displayName": "string",
      "url": "string",
      "photos": [
        {
          "id": "uuid",
          "path": "string",
          "thumbnail": "string",
          "uploadDate": "timestamp",
          "tags": ["string"],
          "analysisTags": {
            "category": "value"
          },
          "notes": "string",
          "metadata": {
            "posted": "date",
            "likes": "number",
            "comments": "number",
            "engagementRate": "string"
          }
        }
      ]
    }
  }
}
```

### File Organization

```
DTAM/
├── data/
│   └── app-data.json
├── public/
│   ├── css/
│   ├── js/
│   └── uploads/
│       ├── facebook/
│       ├── instagram/
│       ├── twitter/
│       ├── tiktok/
│       └── youtube/
└── views/
    ├── welcome.ejs
    ├── case-info.ejs
    ├── soc-status.ejs
    ├── safety-assessment.ejs
    ├── workstation.ejs
    └── summary.ejs
```

## Security Considerations

### Access Control
- Limited to authorized professionals
- Training and certification requirements
- Non-transferable access credentials

### Data Protection
- Local file storage for sensitive data
- Secure file upload handling
- Session management and clearing
- Automatic file type validation

## Recent Updates

The application currently implements core functionality for:
- Multi-platform social media analysis
- Photo upload and management
- Analysis tagging system
- Report generation
- Session management

Future enhancements may include:
- Enhanced authentication system
- Additional platform integrations
- Advanced analytics capabilities
- PDF report generation
- Cloud storage options

## Best Practices

1. **Regular Session Clearing**
   - Clear sessions after completing analysis
   - Remove uploaded photos when done
   - Reset platform data between cases

2. **Systematic Analysis**
   - Complete all analysis categories
   - Document findings thoroughly
   - Save progress regularly
   - Generate reports promptly

3. **Photo Management**
   - Upload photos systematically
   - Apply relevant tags immediately
   - Document observations in notes
   - Track analysis progress

4. **Report Generation**
   - Review all platform data
   - Ensure complete analysis
   - Preview before final generation
   - Save reports securely
