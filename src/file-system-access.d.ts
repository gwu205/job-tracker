// Minimal ambient augmentation for File System Access API pieces missing from the current
// TypeScript DOM lib: the window-level file pickers, and permission querying on a handle.
// FileSystemFileHandle itself (createWritable/getFile) is already covered by lib.dom.d.ts.

interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite'
}

interface FileSystemHandle {
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
}

interface FilePickerAcceptType {
  description?: string
  accept: Record<string, string[]>
}

interface SaveFilePickerOptions {
  suggestedName?: string
  types?: FilePickerAcceptType[]
}

interface OpenFilePickerOptions {
  types?: FilePickerAcceptType[]
  multiple?: boolean
}

interface Window {
  showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>
  showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>
}
