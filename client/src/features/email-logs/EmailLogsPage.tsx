import React, { useState, useEffect } from 'react';
import {
  Mail,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Inbox,
  Sparkles,
} from 'lucide-react';
import api from '../../api/client';

interface EmailLog {
  id: string;
  messageId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  status: string;
  receivedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber: string;
  } | null;
}

export const EmailLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isSimulateOpen, setIsSimulateOpen] = useState<boolean>(false);
  const [simFrom, setSimFrom] = useState<string>('sarah.jenkins@peoplepay360.com');
  const [simSubject, setSimSubject] = useState<string>('Urgent Sick Leave Request for Tomorrow');
  const [simBody, setSimBody] = useState<string>('Hi HR,\n\nI am feeling unwell today and would like to request 1 day of sick leave for tomorrow.\n\nThanks,\nSarah');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/email/logs');
      if (res.data?.success) {
        setLogs(res.data.data?.items || []);
      } else {
        setLogs([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch email logs:', err);
      setError(err.response?.data?.error?.message || 'Failed to load email ingestion logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSimulateInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSuccessMsg(null);
      setError(null);

      const res = await api.post('/email/inbound', {
        from: simFrom,
        to: 'hr@peoplepay360.com',
        subject: simSubject,
        body: simBody,
        messageId: `MSG-SIM-${Date.now()}`
      });

      if (res.data?.success) {
        setSuccessMsg(
          res.data.data?.workflowTriggered
            ? `Email received & matched to employee ${res.data.data?.matchedEmployee?.name}! Leave request workflow triggered.`
            : 'Email received and logged. (Sender not matched to active employee).'
        );
        setIsSimulateOpen(false);
        fetchLogs();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to simulate inbound email');
    } finally {
      setSubmitting(false);
    }
  };

  const matchedCount = logs.filter(l => Boolean(l.employee)).length;
  const unmatchedCount = logs.filter(l => !l.employee).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Email AI Ingestion Logs</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Ingestion
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitor automated email intake, employee identity matching, and AI leave workflow triggers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsSimulateOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-medium transition shadow-md flex items-center gap-2 text-sm"
          >
            <Send className="w-4 h-4" />
            Simulate Inbound Email
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-bold text-emerald-700 underline">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Ingested</p>
            <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Matched to Employee</p>
            <p className="text-2xl font-bold text-slate-900">{matchedCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Unmatched Senders</p>
            <p className="text-2xl font-bold text-slate-900">{unmatchedCount}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Inbound Email Audit History</h2>
          <span className="text-xs text-slate-500">Showing latest live records</span>
        </div>

        {loading && logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-2" />
            <p>Loading email logs from backend...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">No email logs found</p>
            <p className="text-xs text-slate-400 mt-1">Use "Simulate Inbound Email" to trigger an AI leave ingestion event.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">SENDER & RECIPIENT</th>
                  <th className="px-6 py-3">SUBJECT & PREVIEW</th>
                  <th className="px-6 py-3">MATCHED EMPLOYEE</th>
                  <th className="px-6 py-3">STATUS</th>
                  <th className="px-6 py-3">RECEIVED AT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{log.from}</div>
                      <div className="text-xs text-slate-400">To: {log.to}</div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <div className="font-semibold text-slate-900 line-clamp-1">{log.subject}</div>
                      <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{log.body}</div>
                    </td>
                    <td className="px-6 py-4">
                      {log.employee ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-emerald-600" />
                          <div>
                            <div className="font-medium text-slate-900">
                              {log.employee.firstName} {log.employee.lastName}
                            </div>
                            <div className="text-xs text-slate-400">#{log.employee.employeeNumber}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500">Unmatched</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-1.5 pt-5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.receivedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Inbound Simulation */}
      {isSimulateOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-slate-900">Simulate Inbound AI Email</h3>
              </div>
              <button
                onClick={() => setIsSimulateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulateInbound} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Sender Email (From)
                </label>
                <input
                  type="email"
                  required
                  value={simFrom}
                  onChange={(e) => setSimFrom(e.target.value)}
                  placeholder="e.g. sarah.jenkins@peoplepay360.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">If email matches an employee record, AI leave workflow triggers automatically.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={simSubject}
                  onChange={(e) => setSimSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Email Body Content
                </label>
                <textarea
                  rows={4}
                  required
                  value={simBody}
                  onChange={(e) => setSimBody(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSimulateOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition shadow flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Ingesting Email...' : 'Send Inbound Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailLogsPage;
