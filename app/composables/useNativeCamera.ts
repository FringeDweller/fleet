import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Directory, Filesystem } from '@capacitor/filesystem'

export const useNativeCamera = () => {
  const { isNative } = useCapacitor()

  const takePhoto = async () => {
    if (!isNative.value) {
      // Fallback for web (standard input)
      return new Promise<string>((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.capture = 'environment'
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (re) => resolve(re.target?.result as string)
            reader.readAsDataURL(file)
          }
        }
        input.click()
      })
    }

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera
    })

    return image.webPath
  }

  const savePhotoToFilesystem = async (webPath: string) => {
    if (!isNative.value) return webPath

    const response = await fetch(webPath)
    const blob = await response.blob()
    const base64Data = await convertBlobToBase64(blob)

    const fileName = `fleet_${Date.now()}.jpg`
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    })

    return savedFile.uri
  }

  const convertBlobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = () => {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(blob)
    })

  return {
    takePhoto,
    savePhotoToFilesystem
  }
}
