import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  const teacher = await getCurrentTeacher();
  if (teacher) redirect("/dashboard");
  const error = searchParams?.error;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand-row">
          <div className="auth-brand-mark">P</div>
          <div>
            <h1>导师论文工作台</h1>
            <p>学生 · 投稿 · 返修</p>
          </div>
        </div>
        <div className="auth-heading">
          <h2>教师登录</h2>
          <p>进入你的论文管理工作区</p>
        </div>
        {error ? <div className="auth-error">{error}</div> : null}
        <form action="/api/auth/login" method="post" className="auth-form">
          <label>
            <span>邮箱</span>
            <input name="email" type="email" autoComplete="email" required placeholder="name@university.edu.cn" />
          </label>
          <label>
            <span>密码</span>
            <input name="password" type="password" autoComplete="current-password" required placeholder="请输入密码" />
          </label>
          <button type="submit">登录</button>
        </form>
        <p className="auth-switch">第一次使用？ <Link href="/register">注册教师账号</Link></p>
      </section>
    </main>
  );
}
