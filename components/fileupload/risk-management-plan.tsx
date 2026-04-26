"use client"
import { useRef, useState } from "react"
import { ImageKitProvider, IKUpload } from "imagekitio-next"
import { Button } from "@/components/ui/button"
import { FileText, X, Upload } from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import config from "@/lib/config/config"

type UploadedFile = {
  filePath: string
  url: string
  name: string
  size: number
}

type ImageKitUploadResponse = {
  filePath: string
  name: string
  url: string
  fileId: string
  height: number
  width: number
  size: number
  fileType: string
  isPrivateFile: boolean
  thumbnailUrl?: string
}

const {
  env: {
    imagekit: { publicKey, urlEndpoint },
  },
} = config

const authenticator = async () => {
  try {
    const response = await fetch(`${config.env.apiEndpoint}/api/auth/imagekit`)
    const data = await response.json()
    const { signature, expire, token } = data
    return { token, expire, signature }
    /* eslint-disable  @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    throw new Error(`Authentication request failed: ${error.message}`)
  }
}

const RiskManagementPlan = ({
  onFilesChange,
}: {
  onFilesChange: (url: string) => void
}) => {
  const IKUploadRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const onError = (error: any) => {
    console.error(error)
    setIsUploading(false)
    setUploadProgress(0)
    toast.error("File upload failed", {
      description: `An error occurred during upload.`,
    })
  }

  const onSuccess = (res: ImageKitUploadResponse) => {
    const fullUrl = `${urlEndpoint}/${res.filePath}`
    const newFile = {
      filePath: res.filePath,
      url: fullUrl,
      name: res.name,
      size: res.size,
    }

    setFiles([newFile]) // override with one file
    onFilesChange(newFile.url) // return single string
    setIsUploading(false)
    setUploadProgress(100)

    toast.success("File uploaded", {
      description: `${res.name} uploaded successfully`,
    })

    setTimeout(() => setUploadProgress(0), 2000)
  }

    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 5MB in bytes

    const onUploadStart = () => {
        const fileInput = IKUploadRef.current
        const file = fileInput?.files?.[0]

        if (file && file.size > MAX_FILE_SIZE) {
            toast.error("File-ka wuu ka weyn yahay 10MB")
            fileInput.value = "" // clear input
            return
        }

        setIsUploading(true)
        setUploadProgress(0)
    }

    /* eslint-disable  @typescript-eslint/no-explicit-any */
  const onUploadProgress = (progress: any) => {
    if (progress && progress.loaded && progress.total) {
      const percentCompleted = Math.round((progress.loaded * 100) / progress.total)
      setUploadProgress(percentCompleted)
    }
  }

  const removeFile = () => {
    setFiles([])
    onFilesChange("") // empty string instead of []
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <ImageKitProvider publicKey={publicKey} urlEndpoint={urlEndpoint} authenticator={authenticator}>
      <div className="w-full mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-dashed rounded-md p-6 shadow-sm">

          {/* File List */}
          {files.length > 0 && (
            <div className="px-4 py-3">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="h-6 w-6 p-0 hover:bg-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="px-4 py-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div className="px-4 py-6">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <Button
                variant="ghost"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={(e) => {
                  e.preventDefault()
                  IKUploadRef.current?.click()
                }}
                disabled={isUploading}
              >
                {files.length > 0 ? "Replace file" : "Upload file"}
              </Button>
              <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 10MB</p>
            </div>
          </div>
        </div>

        <IKUpload
          className="hidden"
          ref={IKUploadRef}
          onError={onError}
          onSuccess={onSuccess}
          onUploadStart={onUploadStart}
          onUploadProgress={onUploadProgress}
          accept="application/pdf,.doc,.docx"
        />
      </div>
    </ImageKitProvider>
  )
}

export default RiskManagementPlan
