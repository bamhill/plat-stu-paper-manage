import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth";
import { hasPendingLegacyClaim } from "@/lib/auth-store";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams?: { error?: string } }) {
  const teacher = await getCurrentTeacher();
  if (teacher) redirect("/dashboard");
  const error = searchParams?.error;
  const canClaim = hasPendingLegacyClaim();

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand-row">
          <div className="auth-brand-mark">P</div>
          <div>
            <h1>导师论文工作台</h1>
            <p>建立你的学生论文工作区</p>
          </div>
        </div>
        <div className="auth-heading">
          <h2>教师注册</h2>
          <p>注册后即可管理自己的学生与论文</p>
        </div>
        {error ? <div className="auth-error">{error}</div> : null}
        <form action="/api/auth/register" method="post" className="auth-form">
          <label>
            <span>教师姓名</span>
            <input name="name" type="text" autoComplete="name" required placeholder="姓名" />
          </label>
          <label>
            <span>邮箱</span>
            <input name="email" type="email" autoComplete="email" required placeholder="name@university.edu.cn" />
          </label>
          <label>
            <span>密码</span>
            <input name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="至少 8 位" />
          </label>
          <label>
            <span>确认密码</span>
            <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required placeholder="再次输入密码" />
          </label>
          {canClaim ? (
            <label>
              <span>已有数据认领码 <em className="auth-optional">可选</em></span>
              <input name="claimCode" type="password" autoComplete="off" placeholder="原有数据管理员填写" />
            </label>
          ) : null}
          <button type="submit">注册并进入工作台</button>
        </form>
        <p className="auth-switch">已有账号？ <Link href="/login">返回登录</Link></p>
      </section>
    </main>
  );
}
