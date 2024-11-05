'use client'

import { useState, useEffect } from 'react'
import { Server, RefreshCw, Activity, Bell, User, File, Trash, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type ServerStatus = 'online' | 'offline' | 'rebooting'

interface JsonFile {
  id: string;
  name: string;
}

export default function Component() {
  const [server, setServer] = useState({
    name: 'Main Server',
    status: 'online' as ServerStatus,
  })
  
  const [isPinging, setIsPinging] = useState(false)
  const [pingResult, setPingResult] = useState<string | null>(null)
  const [jsonFiles, setJsonFiles] = useState<JsonFile[]>([])
  const [settings, setSettings] = useState({ max_file_size: 10, fetch_time: 100 });
  const [isSaving, setIsSaving] = useState(false);

  const getStatusColor = (status: ServerStatus) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'offline':
        return 'bg-red-500'
      case 'rebooting':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const refreshStatus = () => {
    setServer(prev => ({ ...prev, status: 'online' }))
  }



  const pingServer = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const response = await fetch('https://garuda.pitmtech.com/ping');
      const data = await response.json();
      if (response.ok) {
        setPingResult(data.latency || 'No response');
      } else {
        setPingResult('Ping failed');
      }
    } catch {
      setPingResult('Ping error');
    }
  }
  
  const fetchJsonFiles = async () => {
    try {
      const response = await fetch('https://garuda.pitmtech.com/files')
      
      const data = await response.json()
      setJsonFiles(data)
    } catch (error) {
      console.error('Failed to fetch files', error)
    }
  }

  const removeFile = async (name: string) => {
    try {
      const response = await fetch('https://garuda.pitmtech.com/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (!response.ok) throw new Error('Failed to delete file')
      const result = await response.json()
      console.log(result)
      fetchJsonFiles()  // Refresh the list of files after deletion
    } catch (error) {
      console.error('Failed to delete file', error)
    }
  }

  const downloadFile = (name: string) => {
    window.open(`https://garuda.pitmtech.com/files/download/${name}`, '_blank')
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('https://garuda.pitmtech.com/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Failed to fetch settings', error)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('https://garuda.pitmtech.com/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!response.ok) throw new Error('Failed to save settings')
      console.log('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings', error)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    fetchJsonFiles() // Fetch files on component mount
    fetchSettings()  // Fetch settings on component mount
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prevSettings) => ({
      ...prevSettings,
      [name]: parseInt(value, 10)  // Convert input to integer
    }))
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Server className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Garuda Server Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Server Status</CardTitle>
              <CardDescription>{server.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${getStatusColor(server.status)}`} />
                  <span className="text-sm font-medium capitalize">{server.status}</span>
                </div>
                <Button onClick={refreshStatus} size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">

                <Button 
                  onClick={pingServer} 
                  disabled={isPinging || server.status === 'offline'}
                  className="w-full"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {isPinging ? 'Pinging...' : 'Ping'}
                </Button>
              </div>

              {pingResult && (
                <div className="text-center text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <span className="font-medium">Ping result:</span> {pingResult}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Server Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">IP Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">Unavailable</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">Unavailable</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Uptime</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">99.9%</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>JSON Files</CardTitle>
            <CardDescription>Manage your server configuration files</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {jsonFiles.map((file) => (
                <li key={file.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => removeFile(file.name)} size="sm" variant="outline">
                      <Trash className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                    <Button onClick={() => downloadFile(file.name)} size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Server Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max File Quantity</label>
                <input
                  type="number"
                  name="max_file_size"
                  value={settings.max_file_size}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fetch Time (seconds)</label>
                <input
                  type="number"
                  name="fetch_time"
                  value={settings.fetch_time}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <Button onClick={saveSettings} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © 2023 Server Management Dashboard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
