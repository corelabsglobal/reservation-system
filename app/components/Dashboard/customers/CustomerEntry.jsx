'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { User, Phone, Mail, Plus, X, Save, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ManualCustomerEntry = ({ restaurantId, onCustomerAdded }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // At least one field should be filled
    if (!customer.name && !customer.phone && !customer.email) {
      newErrors.general = 'Please fill in at least one field (name, phone, or email)';
    }

    // Validate email format if provided
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate phone format if provided (Ghanaian format)
    if (customer.phone) {
      const digits = customer.phone.replace(/\D/g, '');
      if (digits.length < 9 || digits.length > 12) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    
    // Format Ghanaian numbers
    if (digits.startsWith('233') && digits.length === 12) {
      return '0' + digits.substring(3);
    } else if (digits.startsWith('+233') && digits.length === 13) {
      return '0' + digits.substring(4);
    } else if (digits.startsWith('0') && digits.length === 10) {
      return digits;
    } else if (digits.length === 9) {
      return '0' + digits;
    }
    
    return digits;
  };

  const handleInputChange = (field, value) => {
    setCustomer(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handlePhoneChange = (value) => {
    const formattedPhone = formatPhoneNumber(value);
    handleInputChange('phone', formattedPhone);
  };

  const resetForm = () => {
    setCustomer({
      name: '',
      phone: '',
      email: ''
    });
    setErrors({});
    setIsAdding(false);
  };

  const saveCustomer = async () => {
    if (!validateForm()) {
      return;
    }

    if (!restaurantId) {
      toast.error('Restaurant information not available');
      return;
    }

    setIsSaving(true);

    try {
      const customerData = {
        restaurant_id: restaurantId,
        name: customer.name.trim() || null,
        phone: customer.phone || null,
        email: customer.email ? customer.email.toLowerCase().trim() : null,
        source: 'manual'
      };

      const { data, error } = await supabase
        .from('customers')
        .upsert(customerData, {
          onConflict: 'restaurant_id,email,phone',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('Error saving customer:', error);
        throw error;
      }

      toast.success('Customer added successfully!');
      resetForm();
      
      // Notify parent component to refresh customer list
      if (onCustomerAdded) {
        onCustomerAdded();
      }

    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldCompletion = () => {
    const filledFields = [customer.name, customer.phone, customer.email].filter(Boolean).length;
    return filledFields;
  };

  if (!isAdding) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <UserPlus className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Add Customer Manually</h3>
                <p className="text-sm text-gray-300">
                  Enter customer details one by one
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-yellow-400" />
            <CardTitle className="text-lg text-white">Add New Customer</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetForm}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-gray-300">
          Enter customer information. At least one field is required.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Fields completed:</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`w-2 h-2 rounded-full ${
                    num <= getFieldCompletion() 
                      ? 'bg-green-400' 
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {getFieldCompletion()}/3
            </span>
          </div>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{errors.general}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter customer's full name"
              value={customer.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500"
            />
            {customer.name && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                Name provided
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-white flex items-center gap-2">
              <Phone className="h-4 w-4 text-yellow-400" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., 0541234567"
              value={customer.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500"
            />
            {errors.phone && (
              <p className="text-xs text-red-400">{errors.phone}</p>
            )}
            {customer.phone && !errors.phone && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                Phone number formatted
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white flex items-center gap-2">
              <Mail className="h-4 w-4 text-green-400" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={customer.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500"
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email}</p>
            )}
            {customer.email && !errors.email && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                Valid email format
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={saveCustomer}
            disabled={isSaving || (!customer.name && !customer.phone && !customer.email)}
            className="flex-1 bg-gradient-to-r from-yellow-400 to-pink-600 hover:from-yellow-500 hover:to-pink-700 text-white font-medium"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Customer
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={resetForm}
            disabled={isSaving}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Cancel
          </Button>
        </div>

        {/* Quick Tips */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            💡 <strong>Tip:</strong> Fill in as many fields as possible for better customer profiling and marketing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualCustomerEntry;