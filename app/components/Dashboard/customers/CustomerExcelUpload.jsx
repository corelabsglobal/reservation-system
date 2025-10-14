'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Upload, X, Download } from 'lucide-react';

const CustomerUpload = ({ restaurantId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCustomers, setUploadedCustomers] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setIsUploading(true);

    try {
      const data = await readExcelFile(file);
      
      if (data.length === 0) {
        toast.error('No valid customer data found in the file');
        return;
      }

      setUploadedCustomers(data);
      setShowUploadModal(true);
      toast.success(`Found ${data.length} customers in the file`);

    } catch (error) {
      console.error('Error reading Excel file:', error);
      toast.error('Error reading Excel file');
    } finally {
      setIsUploading(false);
    }
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Validate and transform data
          const customers = jsonData
            .map((row, index) => {
              // Handle different column name variations
              const name = row.name || row.Name || row.customer-name || row['Customer Name'] || '';
              const phone = row.phone || row.Phone || row.number || row.Number || row['Phone Number'] || '';
              const email = row.email || row.Email || row['Email Address'] || '';

              if (!name && !phone && !email) {
                console.warn(`Skipping row ${index + 1}: No valid customer data`);
                return null;
              }

              return {
                name: name.toString().trim(),
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
      reader.readAsArrayBuffer(file);
    });
  };

  const formatPhoneNumber = (phone) => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format Ghanaian numbers
    if (digits.startsWith('233') && digits.length === 12) {
      return '0' + digits.substring(3);
    } else if (digits.startsWith('0') && digits.length === 10) {
      return digits;
    } else if (digits.length === 9) {
      return '0' + digits;
    }
    
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

      toast.success(`Successfully added ${data.length} customers`);
      setShowUploadModal(false);
      setUploadedCustomers([]);
      
      // Refresh the page to show updated customer list
      window.location.reload();

    } catch (error) {
      console.error('Error saving customers:', error);
      toast.error('Failed to save customers');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      { name: 'John Doe', phone: '0541234567', email: 'john@example.com' },
      { name: 'Jane Smith', phone: '0209876543', email: 'jane@example.com' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, 'customer_upload_template.xlsx');
  };

  return (
    <>
      <div className="bg-gray-700/50 p-6 rounded-lg mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Upload Customer List</h3>
            <p className="text-gray-400 text-sm">
              Upload an Excel file with customer names and phone numbers. 
              They will be added to your customer database for email marketing.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Download size={16} />
              Download Template
            </button>
            
            <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-pink-600 hover:from-yellow-500 hover:to-pink-700 rounded-lg cursor-pointer transition-colors">
              <Upload size={16} />
              Upload Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Upload Preview Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  Review Uploaded Customers ({uploadedCustomers.length})
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {uploadedCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-400">
                        {customer.phone} {customer.email && `• ${customer.email}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomers}
                disabled={isUploading}
                className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-pink-600 hover:from-yellow-500 hover:to-pink-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Saving...' : `Save ${uploadedCustomers.length} Customers`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerUpload;