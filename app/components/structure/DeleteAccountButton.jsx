"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import toast from 'react-hot-toast'

const DeleteAccountButton = ({ userId, userRole }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      if (userRole === 'restaurant') {
        // Delete restaurant data first
        const { error: restaurantError } = await supabase
          .from('restaurants')
          .delete()
          .eq('owner_id', userId)

        if (restaurantError) throw restaurantError
      }

      // Then delete the user profile
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('owner_id', userId)

      if (profileError) throw profileError

      // Finally sign out and delete auth user
      const { error: authError } = await supabase.auth.signOut()
      if (authError) throw authError

      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
      if (deleteError) throw deleteError

      toast.success('Account deleted successfully')
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account: ' + error.message)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <Button 
        variant="destructive" 
        onClick={() => setOpen(true)}
        className="mt-3"
      >
        Delete Account
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Account Deletion</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="text-white bg-gray-700 border-gray-600 hover:bg-white hover:text-gray-600"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DeleteAccountButton