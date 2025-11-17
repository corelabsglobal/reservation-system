'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Upload, X, Download, User, Phone, Mail, CheckCircle2, HelpCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const CustomerUpload = ({ restaurantId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCustomers, setUploadedCustomers] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Accept both Excel and CSV files
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      toast.error('Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)');
      return;
    }

    setIsUploading(true);

    try {
      const data = await readFile(file);
      
      if (data.length === 0) {
        toast.error('No valid customer data found in the file');
        return;
      }

      setUploadedCustomers(data);
      setShowUploadModal(true);
      toast.success(`Found ${data.length} customers in the file`);

    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Error reading file: ' + error.message);
    } finally {
      setIsUploading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          let jsonData = [];
          
          if (file.name.match(/\.(xlsx|xls)$/)) {
            // Handle Excel files
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            jsonData = XLSX.utils.sheet_to_json(worksheet);
          } else if (file.name.match(/\.csv$/)) {
            // Handle CSV files
            const csvText = e.target.result;
            jsonData = parseCSV(csvText);
          }
          
          // Validate and transform data
          const customers = jsonData
            .map((row, index) => {
              // Handle different column name variations
              const name = row.name || row.Name || row['Customer Name'] || row['customer name'] || row['CUSTOMER NAME'] || '';
              const phone = row.phone || row.Phone || row.number || row.Number || row['Phone Number'] || row['phone number'] || row['PHONE NUMBER'] || row.tel || row.Tel || row.TEL || '';
              const email = row.email || row.Email || row['Email Address'] || row['email address'] || row['EMAIL ADDRESS'] || row['E-mail'] || '';

              // Skip if no valid data
              if (!name && !phone && !email) {
                console.warn(`Skipping row ${index + 1}: No valid customer data`);
                return null;
              }

              return {
                name: name ? name.toString().trim() : '',
                phone: phone ? formatPhoneNumber(phone.toString()) : '',
                email: email ? email.toString().toLowerCase().trim() : ''
              };
            })
            .filter(customer => customer !== null);

          resolve(customers);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      
      if (file.name.match(/\.(xlsx|xls)$/)) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    // Parse headers
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = [];
      let current = '';
      let inQuotes = false;
      
      // Manual CSV parsing to handle quoted values with commas
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/"/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/"/g, ''));
      
      // Create object from headers and values
      const row = {};
      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          row[header] = values[index];
        }
      });
      
      data.push(row);
    }
    
    return data;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    // Remove all non-digit characters
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
    
    // Return original if no specific formatting applied
    return digits;
  };

  const saveCustomers = async () => {
    if (!restaurantId) {
      toast.error('Restaurant information not available');
      return;
    }

    setIsUploading(true);

    try {
      // Prepare customers for insertion
      const customersToInsert = uploadedCustomers.map(customer => ({
        restaurant_id: restaurantId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        source: 'upload'
      }));

      // Insert customers
      const { data, error } = await supabase
        .from('customers')
        .upsert(customersToInsert, {
          onConflict: 'restaurant_id,email,phone',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('Error saving customers:', error);
        throw error;
      }

      toast.success(`Successfully added ${data.length} customers to your database`);
      setShowUploadModal(false);
      setUploadedCustomers([]);
      
      // Refresh the page to show updated customer list
      window.location.reload();

    } catch (error) {
      console.error('Error saving customers:', error);
      toast.error('Failed to save customers: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      { name: 'John Doe', phone: '0541234567', email: 'john@example.com' },
      { name: 'Jane Smith', phone: '0209876543', email: 'jane@example.com' },
      { name: 'Kwame Asante', phone: '0551122334', email: 'kwame@example.com' }
    ];

    // Create Excel file
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, 'customer_upload_template.xlsx');
  };

  const downloadCSVTemplate = () => {
    // Create CSV template
    const csvContent = "name,phone,email\nJohn Doe,0541234567,john@example.com\nJane Smith,0209876543,jane@example.com\nKwame Asante,0551122334,kwame@example.com";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCustomerStats = () => {
    const withEmail = uploadedCustomers.filter(c => c.email).length;
    const withPhone = uploadedCustomers.filter(c => c.phone).length;
    const withBoth = uploadedCustomers.filter(c => c.email && c.phone).length;
    
    return { withEmail, withPhone, withBoth };
  };

  const stats = getCustomerStats();

  return (
    <>
      <div className="bg-gray-700/50 p-6 rounded-lg mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-white">Upload Customer List</h3>
            <p className="text-gray-300 text-sm">
              Upload an Excel or CSV file with customer names, phone numbers, and emails. 
              They will be added to your customer database for email marketing.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="text-xs text-gray-400">
                Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
              </div>
              <button
                onClick={() => setShowRequirements(!showRequirements)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
                title="Show file requirements"
              >
                <HelpCircle size={14} />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <Button
                onClick={downloadTemplate}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
              >
                <Download size={14} />
                Excel Template
              </Button>
              <Button
                onClick={downloadCSVTemplate}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 border-green-600 text-white"
              >
                <Download size={14} />
                CSV Template
              </Button>
            </div>
            
            <Button
              asChild
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-pink-600 hover:from-yellow-500 hover:to-pink-700 text-white font-medium"
            >
              <label className="cursor-pointer">
                <Upload size={16} />
                Upload File
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </Button>
          </div>
        </div>

        {/* File Requirements - Collapsible */}
        {showRequirements && (
          <div className="mt-4 p-4 bg-gray-600/30 rounded-lg border border-gray-600 animate-in fade-in-50">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm text-white">File Requirements:</h4>
              <button
                onClick={() => setShowRequirements(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Include columns for: <strong className="text-yellow-400">name</strong>, <strong className="text-yellow-400">phone</strong>, and/or <strong className="text-yellow-400">email</strong></li>
              <li>• Column names can vary (Name, Customer Name, name, etc.)</li>
              <li>• Phone numbers will be automatically formatted for Ghana</li>
              <li>• Duplicate customers (same email/phone) will be skipped</li>
              <li>• Minimum: at least one of name, phone, or email per row</li>
            </ul>
          </div>
        )}
      </div>

      {/* Upload Confirmation Dialog */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
              Review Customers to Import
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Found {uploadedCustomers.length} customers in your file. Review the details below before saving to your database.
            </DialogDescription>
          </DialogHeader>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gray-700/50 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <User className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Total Customers</p>
                    <p className="text-2xl font-bold text-white">{uploadedCustomers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-700/50 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Mail className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">With Email</p>
                    <p className="text-2xl font-bold text-white">{stats.withEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-700/50 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Phone className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">With Phone</p>
                    <p className="text-2xl font-bold text-white">{stats.withPhone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customers List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-200">Customer Details</h4>
              <div className="px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded-md">
                {uploadedCustomers.length} items
              </div>
            </div>
            
            {uploadedCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No valid customers found in the file.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploadedCustomers.map((customer, index) => (
                  <Card key={index} className="bg-gray-700/30 border-gray-600 hover:bg-gray-700/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-400" />
                              <span className="font-medium text-white">
                                {customer.name || <span className="text-gray-400 italic">No name</span>}
                              </span>
                            </div>
                            <div className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-md border border-gray-500">
                              #{index + 1}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm">
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-gray-300">
                                <Phone className="h-3 w-3 text-yellow-400" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-2 text-gray-300">
                                <Mail className="h-3 w-3 text-green-400" />
                                <span>{customer.email}</span>
                              </div>
                            )}
                          </div>
                          
                          {!customer.phone && !customer.email && (
                            <div className="text-xs text-gray-400 italic mt-1">
                              No contact information provided
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          {customer.name && (
                            <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md">Name</div>
                          )}
                          {customer.phone && (
                            <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-md">Phone</div>
                          )}
                          {customer.email && (
                            <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-md">Email</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700">
            <div className="flex-1 text-sm text-gray-400">
              {stats.withBoth > 0 && (
                <p>{stats.withBoth} customers have both email and phone</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={saveCustomers}
                disabled={isUploading || uploadedCustomers.length === 0}
                className="bg-gradient-to-r from-yellow-400 to-pink-600 hover:from-yellow-500 hover:to-pink-700 text-white font-medium"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  `Import ${uploadedCustomers.length} Customers`
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomerUpload;