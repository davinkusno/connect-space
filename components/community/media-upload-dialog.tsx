"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/loading-indicators"
import { Upload, X, ImageIcon, Video, type File, Plus, AlertCircle } from "lucide-react"

interface MediaUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (files: File[]) => void
}

interface UploadFile {
  file: File
  preview: string
  title: string
  description: string
  tags: string[]
}

export function MediaUploadDialog({ open, onOpenChange, onUpload }: MediaUploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [newTag, setNewTag] = useState("")

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
  }

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")
      const isValidSize = file.size <= 50 * 1024 * 1024 // 50MB limit
      return (isImage || isVideo) && isValidSize
    })

    const uploadFiles: UploadFile[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, ""),
      description: "",
      tags: [],
    }))

    setFiles((prev) => [...prev, ...uploadFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const updateFile = (index: number, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((file, i) => (i === index ? { ...file, ...updates } : file)))
  }

  const addTag = (fileIndex: number, tag: string) => {
    if (tag.trim() && !files[fileIndex].tags.includes(tag.trim())) {
      updateFile(fileIndex, {
        tags: [...files[fileIndex].tags, tag.trim()],
      })
    }
  }

  const removeTag = (fileIndex: number, tagIndex: number) => {
    updateFile(fileIndex, {
      tags: files[fileIndex].tags.filter((_, i) => i !== tagIndex),
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    // Simulate upload delay
    setTimeout(() => {
      clearInterval(interval)
      setUploadProgress(100)
      onUpload(files.map((f) => f.file))

      // Cleanup
      files.forEach((file) => URL.revokeObjectURL(file.preview))
      setFiles([])
      setUploading(false)
      setUploadProgress(0)
    }, 2000)
  }

  const handleClose = () => {
    if (!uploading) {
      files.forEach((file) => URL.revokeObjectURL(file.preview))
      setFiles([])
      setNewTag("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Share photos and videos with your community. Supported formats: JPG, PNG, GIF, MP4, MOV (max 50MB)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Upload Area */}
          {files.length === 0 && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-violet-400 bg-violet-50 dark:bg-violet-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-violet-300 dark:hover:border-violet-500"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Drop files here or click to browse
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload images and videos to share with your community
              </p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Plus className="h-4 w-4 mr-2" />
                    Choose Files
                  </span>
                </Button>
              </Label>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Selected Files ({files.length})
                </h3>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="add-more-files"
                />
                <Label htmlFor="add-more-files">
                  <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                    <span>
                      <Plus className="h-4 w-4 mr-2" />
                      Add More
                    </span>
                  </Button>
                </Label>
              </div>

              <div className="grid gap-4">
                {files.map((uploadFile, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex gap-4">
                      {/* Preview */}
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {uploadFile.file.type.startsWith("image/") ? (
                          <img
                            src={uploadFile.preview || "/placeholder.svg"}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-1 left-1">
                          <Badge variant="secondary" className="text-xs">
                            {uploadFile.file.type.startsWith("image/") ? (
                              <ImageIcon className="h-3 w-3 mr-1" />
                            ) : (
                              <Video className="h-3 w-3 mr-1" />
                            )}
                            {uploadFile.file.type.startsWith("image/") ? "Image" : "Video"}
                          </Badge>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{uploadFile.file.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`title-${index}`} className="text-sm font-medium">
                              Title
                            </Label>
                            <Input
                              id={`title-${index}`}
                              value={uploadFile.title}
                              onChange={(e) => updateFile(index, { title: e.target.value })}
                              placeholder="Enter a title..."
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`description-${index}`} className="text-sm font-medium">
                              Description
                            </Label>
                            <Textarea
                              id={`description-${index}`}
                              value={uploadFile.description}
                              onChange={(e) => updateFile(index, { description: e.target.value })}
                              placeholder="Add a description..."
                              className="mt-1 min-h-[80px]"
                            />
                          </div>
                        </div>

                        {/* Tags */}
                        <div>
                          <Label className="text-sm font-medium">Tags</Label>
                          <div className="flex flex-wrap gap-2 mt-2 mb-2">
                            {uploadFile.tags.map((tag, tagIndex) => (
                              <Badge
                                key={tagIndex}
                                variant="outline"
                                className="text-xs border-gray-200 dark:border-gray-700"
                              >
                                {tag}
                                <button onClick={() => removeTag(index, tagIndex)} className="ml-1 hover:text-red-600">
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Add a tag..."
                              className="flex-1"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addTag(index, newTag)
                                  setNewTag("")
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                addTag(index, newTag)
                                setNewTag("")
                              }}
                              disabled={!newTag.trim()}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Spinner size="sm" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Uploading {files.length} file{files.length > 1 ? "s" : ""}...
                </span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Upload Guidelines</h4>
                <ul className="text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Keep content appropriate and relevant to the community</li>
                  <li>• Maximum file size: 50MB per file</li>
                  <li>• Supported formats: JPG, PNG, GIF, MP4, MOV</li>
                  <li>• Add descriptive titles and tags to help others discover your content</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="bg-violet-700 hover:bg-violet-800 text-white"
          >
            {uploading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} File{files.length > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
