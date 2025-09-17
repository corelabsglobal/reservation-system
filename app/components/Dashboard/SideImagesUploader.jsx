'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SideImagesUploader = ({ restaurant, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [currentImages, setCurrentImages] = useState(restaurant?.side_images || []);
  const [showAllImages, setShowAllImages] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file) return "";

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      return data.url;
    } catch (error) {
      console.error("Upload error:", error.message);
      toast.error("Image upload failed");
      return "";
    }
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;

    const totalImagesAfterUpload = currentImages.length + files.length;
    if (totalImagesAfterUpload > 6) {
      toast.error(`Maximum of 6 images allowed. You can only upload ${6 - currentImages.length} more.`);
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(file => handleUpload(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      const successfulUploads = uploadedUrls.filter(url => url !== "");
      
      if (successfulUploads.length > 0) {
        const updatedImages = [...currentImages, ...successfulUploads];
        
        // Update the database
        const { error } = await supabase
          .from('restaurants')
          .update({ side_images: updatedImages })
          .eq('id', restaurant.id);

        if (error) throw error;

        setCurrentImages(updatedImages);
        onUpdate?.(); // Refresh parent component if needed
        toast.success(`Uploaded ${successfulUploads.length} image${successfulUploads.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const confirmRemoveImage = (index) => {
    setDeletingIndex(index);
  };

  const cancelRemoveImage = () => {
    setDeletingIndex(null);
  };

  const removeImage = async () => {
    if (deletingIndex === null) return;

    try {
      const updatedImages = currentImages.filter((_, i) => i !== deletingIndex);
      
      const { error } = await supabase
        .from('restaurants')
        .update({ side_images: updatedImages })
        .eq('id', restaurant.id);

      if (error) throw error;

      setCurrentImages(updatedImages);
      onUpdate?.(); // Refresh parent component if needed
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    } finally {
      setDeletingIndex(null);
    }
  };

  const imagesToShow = showAllImages ? currentImages : currentImages.slice(0, 4);
  const hasMoreImages = currentImages.length > 4;

  return (
    <div className="bg-gray-700/50 p-4 rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-bold text-yellow-400">Restaurant Gallery Images</h3>
        <div className="group relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute hidden group-hover:block bottom-full mb-2 w-64 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg">
            Upload up to 6 images of your restaurant, menus, staff, or ambiance. These will be displayed on your restaurant page.
          </div>
        </div>
      </div>

      {/* Upload Section - Fixed for mobile */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Upload Images (Max 6)
        </label>
        
        {/* Mobile-optimized file input container */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading || currentImages.length >= 6}
            multiple
            className="w-full p-3 bg-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-gray-900 hover:file:bg-yellow-400"
          />
          
          {/* Loading indicator positioned absolutely to not affect layout */}
          {uploading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center bg-gray-700/90 px-3 py-1 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-500 mr-2"></div>
              <span className="text-sm text-gray-300">Uploading...</span>
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-400 mt-2">
          {currentImages.length}/6 images uploaded • Supported: JPG, PNG, WebP
        </p>
      </div>

      {/* Images Grid */}
      {currentImages.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imagesToShow.map((imageUrl, index) => (
              <div key={index} className="relative group bg-gray-800 rounded-lg overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={imageUrl}
                    alt={`Restaurant image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => confirmRemoveImage(index)}
                      className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                      title="Delete image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Toggle */}
          {hasMoreImages && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAllImages(!showAllImages)}
                className="text-yellow-400 hover:text-yellow-300 text-sm font-medium flex items-center justify-center mx-auto px-4 py-2 bg-gray-800/50 rounded-lg transition-colors"
              >
                {showAllImages ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Show Less
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    View All {currentImages.length} Images
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {currentImages.length === 0 && (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-light">No gallery images yet</p>
          <p className="text-sm mt-1">Upload images to showcase your restaurant's ambiance</p>
        </div>
      )}

      {/* Delete Confirmation Dialog using Shadcn UI */}
      <Dialog open={deletingIndex !== null} onOpenChange={(open) => !open && cancelRemoveImage()}>
        <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Image?</DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to delete this image? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={cancelRemoveImage}
              className="bg-gray-600 text-white border-gray-600 hover:bg-gray-500 flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={removeImage}
              className="flex-1 sm:flex-none"
            >
              Delete Image
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SideImagesUploader;