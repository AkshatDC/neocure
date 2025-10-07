# Setup Environment Variables Script
# This script copies .env.example to .env if it doesn't exist

Write-Host "NeoCure Environment Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
if (Test-Path ".env") {
    Write-Host ".env file already exists" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current API Keys Status:" -ForegroundColor Yellow
    
    # Check for API keys
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "OPENAI_API_KEY=sk-") {
        Write-Host "  OpenAI API Key: Configured" -ForegroundColor Green
    } else {
        Write-Host "  OpenAI API Key: Not set" -ForegroundColor Yellow
    }
    
    if ($envContent -match "PINECONE_API_KEY=pcsk_") {
        Write-Host "  Pinecone API Key: Configured" -ForegroundColor Green
    } else {
        Write-Host "  Pinecone API Key: Not set" -ForegroundColor Yellow
    }
    
    if ($envContent -match "CLOUDINARY_CLOUD_NAME=") {
        Write-Host "  Cloudinary: Configured" -ForegroundColor Green
    } else {
        Write-Host "  Cloudinary: Not set" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host ".env file created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Your API keys are now in the .env file" -ForegroundColor Yellow
    Write-Host "This file is gitignored and will NOT be committed to Git" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm install" -ForegroundColor White
Write-Host "  2. Run: npm run prisma:migrate" -ForegroundColor White
Write-Host "  3. Run: npm run seed" -ForegroundColor White
Write-Host "  4. Run: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "For detailed setup instructions, see: API_KEYS_SETUP.md" -ForegroundColor Cyan
Write-Host ""
