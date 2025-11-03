// Test script to simulate the complete UPI payment flow
// Run with: node test-payment-flow.js

const axios = require('axios')

const BASE_URL = 'http://localhost:3001'

// Mock authentication tokens (in real scenario, these would come from login)
const TENANT_TOKEN = 'mock-tenant-token'
const OWNER_TOKEN = 'mock-owner-token'

async function simulatePaymentFlow() {
  try {
    console.log('🚀 Starting UPI Payment Flow Simulation\n')

    // Step 1: Create a booking (normally done through booking API)
    console.log('1. Creating test booking...')
    const bookingId = 'test-booking-' + Date.now()

    // Step 2: Tenant creates payment
    console.log('2. Tenant creates payment...')
    const createPaymentResponse = await axios.post(`${BASE_URL}/api/payments/create`, {
      bookingId
    }, {
      headers: { 'Authorization': `Bearer ${TENANT_TOKEN}` }
    })

    const { paymentId, upiUri, qrCode, amount } = createPaymentResponse.data.data
    console.log(`✅ Payment created: ${paymentId}`)
    console.log(`💰 Amount: ₹${amount / 100}`)
    console.log(`📱 UPI URI: ${upiUri}`)
    console.log(`📱 QR Code: ${qrCode}\n`)

    // Step 3: Tenant confirms payment (simulating UPI transfer)
    console.log('3. Tenant confirms payment...')
    const confirmResponse = await axios.post(`${BASE_URL}/api/payments/confirm`, {
      paymentId,
      upiReference: 'UPI' + Date.now() // Simulated UPI transaction ID
    }, {
      headers: { 'Authorization': `Bearer ${TENANT_TOKEN}` }
    })

    console.log(`✅ Payment confirmed: ${confirmResponse.data.data.status}\n`)

    // Step 4: Owner checks pending payments
    console.log('4. Owner checks pending payments...')
    const pendingResponse = await axios.get(`${BASE_URL}/api/payments/pending`, {
      headers: { 'Authorization': `Bearer ${OWNER_TOKEN}` }
    })

    const pendingPayment = pendingResponse.data.data.find(p => p.id === paymentId)
    console.log(`📋 Found ${pendingResponse.data.data.length} pending payment(s)`)
    if (pendingPayment) {
      console.log(`📋 Payment ${paymentId} is pending verification\n`)
    }

    // Step 5: Owner verifies payment
    console.log('5. Owner verifies payment...')
    const verifyResponse = await axios.post(`${BASE_URL}/api/payments/verify`, {
      paymentId,
      action: 'verify'
    }, {
      headers: { 'Authorization': `Bearer ${OWNER_TOKEN}` }
    })

    const { invoice, booking } = verifyResponse.data.data
    console.log(`✅ Payment verified: ${verifyResponse.data.data.status}`)
    console.log(`📄 Invoice generated: ${invoice.invoiceNo}`)
    console.log(`🏠 Booking confirmed: ${booking.status}\n`)

    // Step 6: Verify final state
    console.log('6. Verifying final state...')
    // In a real scenario, you'd check the database or call relevant APIs

    console.log('🎉 Payment flow completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Payment ID: ${paymentId}`)
    console.log(`   - Amount: ₹${amount / 100}`)
    console.log(`   - Status: VERIFIED`)
    console.log(`   - Invoice: ${invoice.invoiceNo}`)
    console.log(`   - Booking: CONFIRMED`)

  } catch (error) {
    console.error('❌ Payment flow failed:', error.response?.data || error.message)
  }
}

// Simulate rejection flow
async function simulateRejectionFlow() {
  try {
    console.log('\n🚫 Testing Payment Rejection Flow\n')

    // Create another payment
    const bookingId = 'test-booking-reject-' + Date.now()

    const createResponse = await axios.post(`${BASE_URL}/api/payments/create`, {
      bookingId
    }, {
      headers: { 'Authorization': `Bearer ${TENANT_TOKEN}` }
    })

    const { paymentId } = createResponse.data.data

    // Confirm payment
    await axios.post(`${BASE_URL}/api/payments/confirm`, {
      paymentId,
      upiReference: 'UPI' + Date.now()
    }, {
      headers: { 'Authorization': `Bearer ${TENANT_TOKEN}` }
    })

    // Reject payment
    const rejectResponse = await axios.post(`${BASE_URL}/api/payments/verify`, {
      paymentId,
      action: 'reject',
      reason: 'Invalid transaction amount'
    }, {
      headers: { 'Authorization': `Bearer ${OWNER_TOKEN}` }
    })

    console.log(`❌ Payment rejected: ${rejectResponse.data.data.status}`)
    console.log('📝 Reason: Invalid transaction amount')

  } catch (error) {
    console.error('❌ Rejection flow failed:', error.response?.data || error.message)
  }
}

// Frontend QR Code display example
function generateFrontendSnippet(upiUri, amount) {
  return `
<!-- Frontend QR Code Display Example -->
<div class="payment-section">
  <h3>Complete Payment</h3>
  <div class="amount">₹${amount / 100}</div>

  <div class="qr-code-container">
    <canvas id="upi-qr-code"></canvas>
    <p>Scan with any UPI app</p>
  </div>

  <div class="upi-details">
    <p><strong>UPI ID:</strong> owner@upi</p>
    <p><strong>Amount:</strong> ₹${amount / 100}</p>
    <button onclick="confirmPayment('${upiUri}')">I have paid</button>
  </div>

  <div class="status-message" id="payment-status">
    Waiting for payment...
  </div>
</div>

<script>
// Generate QR Code (requires qrcode.js library)
import QRCode from 'qrcode'

async function generateQR() {
  const canvas = document.getElementById('upi-qr-code')
  await QRCode.toCanvas(canvas, '${upiUri}')
}

function confirmPayment(upiUri) {
  // Open UPI app or show manual payment option
  window.open(upiUri, '_blank')

  // Show confirmation dialog
  setTimeout(() => {
    if (confirm('Have you completed the payment?')) {
      markAsPaid()
    }
  }, 2000)
}

async function markAsPaid() {
  try {
    const response = await fetch('/api/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentId: '${upiUri.split('tn=')[1]}', // Extract from URI
        upiReference: prompt('Enter UPI transaction ID (optional):')
      })
    })

    const result = await response.json()
    document.getElementById('payment-status').textContent =
      result.success ? 'Payment submitted for verification' : 'Payment confirmation failed'
  } catch (error) {
    console.error('Error confirming payment:', error)
  }
}

// Initialize
generateQR()
</script>
  `
}

// Run the simulation
async function main() {
  console.log('🧪 UPI Payment System Test Script')
  console.log('================================\n')

  // Note: This script assumes the server is running and mock tokens work
  // In a real scenario, you'd need proper authentication

  try {
    await simulatePaymentFlow()
    await simulateRejectionFlow()

    console.log('\n📱 Frontend QR Code Example:')
    console.log('============================')
    console.log(generateFrontendSnippet('upi://pay?pa=owner@upi&pn=OwnerName&am=1000&tn=Booking123', 100000))

  } catch (error) {
    console.error('Test script failed:', error.message)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { simulatePaymentFlow, simulateRejectionFlow }
