import { ClipboardManager } from '@/components/ClipboardManager';

export default function Clipboard() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Clipboard Manager</h1>
          <p className="text-gray-400">
            Quick access to frequently used tracking numbers, case numbers, and other data
          </p>
        </div>

        <ClipboardManager />
      </div>
    </div>
  );
}
