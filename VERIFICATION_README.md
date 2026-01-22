# BMI University Certificate Verification System

## Overview

The BMI University Certificate Verification System provides secure, QR code-based verification of graduation certificates with both online and offline verification capabilities. This system ensures the authenticity of academic credentials issued by BMI University.

## Features

### 🔐 Security Features
- **QR Code Verification**: Each certificate contains a unique QR code linking to verification data
- **Serial Number Validation**: Certificates use format `BMI-YYYY-XXXXXX` for easy identification
- **Content Hash Verification**: SHA-256 hashing ensures certificate integrity
- **Guilloché Pattern**: Anti-forgery security patterns on certificates
- **Microtext Borders**: Tamper-evident security text
- **Digital Watermarks**: Institutional logo watermarking

### 🌐 Verification Methods
- **Online Verification**: Real-time validation against BMI University database
- **Offline Verification**: QR code scanning with local validation
- **Bulk Verification**: Administrative tool for verifying multiple certificates
- **Mobile App Support**: Dedicated mobile verification application

### 📱 User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Automatic theme detection and manual toggle
- **Multi-language Support**: English with expandable language options
- **Accessibility**: WCAG 2.1 AA compliant interface

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - Verification  │    │ - REST API      │    │ - Certificates  │
│ - QR Scanner    │    │ - Rate Limiting │    │ - Audit Logs    │
│ - Certificate   │    │ - Authentication│    │ - Verification  │
│   Display       │    │ - Validation    │    │   History       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Redis (for caching)
- SSL Certificate (for production)

### Frontend Setup
```bash
# Install dependencies
npm install

# Environment variables
cp .env.example .env
# Edit .env with your configuration

# Development server
npm run dev

# Production build
npm run build
npm run preview
```

### Backend Setup
```bash
# Install backend dependencies
cd backend
npm install

# Database setup
npm run db:migrate
npm run db:seed

# Start server
npm run start:dev
```

### Environment Variables

#### Frontend (.env)
```env
VITE_API_BASE_URL=https://verify.bmi.edu/api/v1
VITE_APP_NAME=BMI University Verification
VITE_LOGO_URL=https://i.ibb.co/Gv2vPdJC/BMI-PNG.png
```

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/bmi_verification
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key
API_RATE_LIMIT=60
CORS_ORIGINS=https://bmi.edu,https://verify.bmi.edu
```

## Usage

### For Certificate Holders