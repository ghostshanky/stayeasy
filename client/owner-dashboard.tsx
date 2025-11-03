import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './components/ui/alert-dialog'
import { Textarea } from './components/ui/textarea'
import { RefreshCw, CheckCircle, XCircle, Eye, IndianRupee } from 'lucide-react'
import { toast } from './components/ui/use-toast'

interface Payment {
  id: string
  bookingId: string
  amount: number
  currency: string
  upiReference: string | null
  status: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  booking: {
    id: string
    checkIn: string
    checkOut: string
    property: {
      name: string
      address: string
    }
  }
}

interface OwnerDashboardProps {
  ownerId: string
}

export function OwnerDashboard({ ownerId }: OwnerDashboardProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchPendingPayments = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/payments/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(data.data)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch pending payments',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast({
        title: 'Error',
        description: 'Network error while fetching payments',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPendingPayments()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPendingPayments, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleVerifyPayment = async (paymentId: string) => {
    setActionLoading(paymentId)
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId,
          action: 'verify'
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Payment verified and invoice generated'
        })
        // Remove from local state
        setPayments(payments.filter(p => p.id !== paymentId))
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to verify payment',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      toast({
        title: 'Error',
        description: 'Network error while verifying payment',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectPayment = async () => {
    if (!selectedPayment || !rejectionReason.trim()) return

    setActionLoading(selectedPayment.id)
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          action: 'reject',
          reason: rejectionReason
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Payment Rejected',
          description: 'Payment has been rejected'
        })
        // Remove from local state
        setPayments(payments.filter(p => p.id !== selectedPayment.id))
        setSelectedPayment(null)
        setRejectionReason('')
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to reject payment',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error rejecting payment:', error)
      toast({
        title: 'Error',
        description: 'Network error while rejecting payment',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'AWAITING_PAYMENT': 'secondary',
      'AWAITING_OWNER_VERIFICATION': 'default',
      'VERIFIED': 'default',
      'REJECTED': 'destructive',
      'CANCELLED': 'outline'
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace(/_/g, ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading payments...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Verification Dashboard</h2>
          <p className="text-muted-foreground">
            Review and verify tenant payments for your properties
          </p>
        </div>
        <Button
          onClick={fetchPendingPayments}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground text-center">
              No pending payments to review at the moment.
              <br />
              New payments will appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {payment.booking.property.name}
                  </CardTitle>
                  {getStatusBadge(payment.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {payment.booking.property.address}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Tenant</div>
                    <div className="font-medium">{payment.user.name}</div>
                    <div className="text-sm text-muted-foreground">{payment.user.email}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Booking Dates</div>
                    <div className="font-medium">
                      {formatDate(payment.booking.checkIn)} - {formatDate(payment.booking.checkOut)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Amount</div>
                    <div className="font-medium text-lg flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {(payment.amount / 100).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground">UPI Reference</div>
                    <div className="font-medium">
                      {payment.upiReference || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Created: {formatDate(payment.createdAt)}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Open audit logs modal or navigate to payment details
                        window.open(`/payments/${payment.id}/audit`, '_blank')
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actionLoading === payment.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject Payment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to reject this payment? This action cannot be undone.
                            Please provide a reason for rejection.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                          <Textarea
                            placeholder="Reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setRejectionReason('')}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleRejectPayment}
                            disabled={!rejectionReason.trim() || actionLoading === payment.id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {actionLoading === payment.id ? 'Rejecting...' : 'Reject Payment'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button
                      size="sm"
                      onClick={() => handleVerifyPayment(payment.id)}
                      disabled={actionLoading === payment.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {actionLoading === payment.id ? 'Verifying...' : 'Verify'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="text-center text-sm text-muted-foreground">
        Auto-refreshing every 30 seconds • {payments.length} pending payment{payments.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

export default OwnerDashboard
