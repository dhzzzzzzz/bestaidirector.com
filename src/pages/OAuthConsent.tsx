import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="container flex min-h-screen items-center justify-center py-16">
      <div className="w-full max-w-md rounded-xl border bg-card p-8">
        {error ? (
          <>
            <h1 className="text-xl font-semibold mb-2">授权请求无法加载</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        ) : !details ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载授权请求…
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-2">
              将 {details.client?.name ?? "该应用"} 连接到你的账户
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              授权后，{details.client?.name ?? "该客户端"} 可以以你的身份访问 AI 宝藏指南 的工具数据与收藏。
            </p>
            <div className="flex gap-3">
              <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                同意授权
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => decide(false)} className="flex-1">
                拒绝
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
