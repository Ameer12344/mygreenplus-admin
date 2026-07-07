import Link from 'next/link';
import { Award, Trash2, Target, CheckCircle2, Clock, Bell } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/server';
import IssueCertificateModal from './IssueCertificateModal';
import AddTaskModal from './AddTaskModal';
import { deleteCertificate } from './actions';
import { deleteTask, toggleTaskStatus } from './taskActions';
import IssueForUserModal from './IssueForUserModal';
import RealtimeRefresher from '@/components/RealtimeRefresher';
import ExportCsvButton from '@/components/ExportCsvButton';

export const dynamic = 'force-dynamic';

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = searchParams.tab === 'tasks' ? 'tasks' : 'certificates';
  const supabase = createServiceClient();

  const [{ data: certificates }, { data: users }, { data: tasks }] = await Promise.all([
    supabase
      .from('certificates')
      .select('id, cert_code, title, subtitle, year, level, total_kg, status, accent_color, issued_at, app_users(name)')
      .order('issued_at', { ascending: false }),
    supabase
      .from('app_users')
      .select('id, name, phone')
      .order('name'),
    supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  // For tasks tab: get user progress from drop_off_history and app_users
  let taskProgress: any[] = [];
  if (tab === 'tasks' && tasks && tasks.length > 0) {
    const { data: dropoffs } = await supabase
      .from('drop_off_history')
      .select('user_id, weight_kg, points_earned, material_type, created_at, app_users(name, email)');

    const { data: appUsers } = await supabase
      .from('app_users')
      .select('id, name, email, phone, eco_points, total_kg');

    // Calculate progress per user per task
    taskProgress = (tasks ?? []).map((task: any) => {
      const userProgressMap: Record<string, { name: string; phone: string | null; value: number; completedAt: Date | null }> = {};

      (appUsers ?? []).forEach((u: any) => {
        let value = 0;
        let completedAt: Date | null = null;

        if (task.goal_type === 'kg_recycled') {
          const relevant = (dropoffs ?? [])
            .filter((d: any) => d.user_id === u.id && (!task.material_type || d.material_type === task.material_type))
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          let running = 0;
          for (const d of relevant) {
            running += d.weight_kg ?? 0;
            if (running >= task.goal_value && !completedAt) {
              completedAt = new Date(d.created_at);
            }
          }
          value = running;
        } else if (task.goal_type === 'drop_off_count') {
          const relevant = (dropoffs ?? [])
            .filter((d: any) => d.user_id === u.id && (!task.material_type || d.material_type === task.material_type))
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          value = relevant.length;
          if (value >= task.goal_value) completedAt = new Date(relevant[task.goal_value - 1]?.created_at);
        } else if (task.goal_type === 'points_earned') {
          value = u.eco_points ?? 0;
          if (value >= task.goal_value) completedAt = new Date(); // no exact timestamp for points
        }

        userProgressMap[u.id] = { name: u.name ?? u.email ?? 'Unknown', phone: u.phone ?? null, value, completedAt };
      });

      const completed = Object.values(userProgressMap).filter((p) => p.value >= task.goal_value).length;
      const newlyCompleted = Object.values(userProgressMap).filter((p) => {
        if (!p.completedAt || p.value < task.goal_value) return false;
        return (Date.now() - p.completedAt.getTime()) < 24 * 60 * 60 * 1000; // last 24h
      }).length;

      return { task, userProgress: userProgressMap, completed, newlyCompleted };
    });
  }

  const goalLabel = (type: string) => {
    if (type === 'kg_recycled') return 'kg';
    if (type === 'drop_off_count') return 'drop-offs';
    if (type === 'points_earned') return 'pts';
    return '';
  };

  return (
    <div className="space-y-6">
      <RealtimeRefresher table="drop_off_history" />
      <RealtimeRefresher table="certificates" />
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-ink">Certificates &amp; Tasks</h1>
          <p className="text-sage-400 text-sm mt-1">
            {tab === 'certificates'
              ? `${certificates?.length ?? 0} certificates issued`
              : `${tasks?.length ?? 0} tasks`}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton type={tab === 'certificates' ? 'certificates' : 'tasks'} />
          {tab === 'certificates' && <IssueCertificateModal users={users ?? []} />}
          {tab === 'tasks' && <AddTaskModal />}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-lg shadow-card p-1 w-fit">
        <Link
          href="/dashboard/certificates"
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'certificates' ? 'bg-forest-900 text-white' : 'text-sage-400 hover:text-ink'}`}
        >
          Certificates
        </Link>
        <Link
          href="/dashboard/certificates?tab=tasks"
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'tasks' ? 'bg-forest-900 text-white' : 'text-sage-400 hover:text-ink'}`}
        >
          Tasks
        </Link>
      </div>

      {tab === 'certificates' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(certificates ?? []).map((c: any) => {
            const color = c.accent_color ?? '#2E7D32';
            return (
              <div key={c.id} className="bg-white rounded-xl2 shadow-card p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}22`, color }}>
                    <Award className="w-4 h-4" />
                  </div>
                  <form action={deleteCertificate}>
                    <input type="hidden" name="certId" value={c.id} />
                    <button type="submit" className="text-sage-400 hover:text-rose-600 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
                <div>
                  <p className="text-ink font-medium leading-snug">{c.title ?? `${c.level} Certificate`}</p>
                  <p className="text-sage-400 text-xs mt-0.5">{c.subtitle ?? ''}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-sage-400 pt-2 border-t border-sage-100">
                  <span>{(c.app_users as any)?.name ?? 'Unknown user'}</span>
                  <span className="font-mono">{c.year ?? new Date(c.issued_at).getFullYear()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sage-400/70">Issued {new Date(c.issued_at).toLocaleDateString()}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                    style={{ backgroundColor: `${color}22`, color }}>{c.level}</span>
                </div>
              </div>
            );
          })}
          {(certificates ?? []).length === 0 && (
            <p className="text-sage-400 text-sm col-span-full text-center py-10">No certificates issued yet.</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {(tasks ?? []).length === 0 && (
            <p className="text-sage-400 text-sm text-center py-10">No tasks yet — add one to get started.</p>
          )}
          {taskProgress.map(({ task, userProgress, completed, newlyCompleted }) => (
            <div key={task.id} className="bg-white rounded-xl2 shadow-card overflow-hidden">
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-forest-900/8 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-forest-900" />
                  </div>
                  <div>
                    <p className="text-ink font-medium">{task.title}</p>
                    {task.description && <p className="text-sage-400 text-xs mt-0.5">{task.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-sage-400">
                      <span>Goal: {task.goal_value} {goalLabel(task.goal_type)}</span>
                      {task.material_type && <span>· {task.material_type}</span>}
                      {task.reward_cert_level && <span className="capitalize">· {task.reward_cert_level} cert</span>}
                      <span className={`px-2 py-0.5 rounded-full font-medium ${task.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-sage-50 text-sage-400'}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={toggleTaskStatus}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="nextStatus" value={task.status === 'active' ? 'inactive' : 'active'} />
                    <button type="submit" className="text-xs font-medium py-1.5 px-3 rounded-lg bg-sage-50 text-ink hover:bg-sage-100 transition-colors">
                      {task.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </form>
                  <form action={deleteTask}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <button type="submit" className="text-sage-400 hover:text-rose-600 transition-colors p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* User progress */}
              <div className="border-t border-sage-100">
                <div className="px-5 py-2 bg-sage-50 flex items-center justify-between">
                  <p className="text-xs font-medium text-sage-400">User Progress</p>
                  <div className="flex items-center gap-2">
                    {newlyCompleted > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <Bell className="w-3 h-3" />
                        {newlyCompleted} new
                      </span>
                    )}
                    <p className="text-xs text-sage-400">{completed} / {Object.keys(userProgress).length} completed</p>
                  </div>
                </div>
                <div className="divide-y divide-sage-100 max-h-48 overflow-y-auto">
                  {Object.entries(userProgress).map(([uid, p]: [string, any]) => {
                    const pct = Math.min((p.value / task.goal_value) * 100, 100);
                    const done = p.value >= task.goal_value;
                    const isNew = done && p.completedAt && (Date.now() - new Date(p.completedAt).getTime()) < 24 * 60 * 60 * 1000;
                    return (
                      <div key={uid} className={`px-5 py-2.5 flex items-center gap-3 ${isNew ? 'bg-amber-50' : ''}`}>
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          : <Clock className="w-4 h-4 text-sage-300 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-ink truncate block">{p.name}</span>
                          {isNew && (
                            <span className="text-xs text-amber-600 font-medium">✓ Just completed</span>
                          )}
                        </div>
                        <div className="w-24 h-1.5 bg-sage-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: done ? '#2E7D32' : '#86BBAD' }}
                          />
                        </div>
                        <span className="text-xs text-sage-400 w-16 text-right">
                          {p.value.toFixed(task.goal_type === 'drop_off_count' ? 0 : 1)} / {task.goal_value} {goalLabel(task.goal_type)}
                        </span>
                        {done && (
                          <IssueForUserModal
                            user={{ id: uid, name: p.name, phone: p.phone }}
                            allUsers={users ?? []}
                            task={task}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
