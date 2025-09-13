// worker/index.mjs
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 例: 簡単な API
    if (url.pathname === "/api/time") {
      return new Response(JSON.stringify({ now: new Date().toISOString() }), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    // それ以外は静的アセットへフォワード
    // env.ASSETS は assets.directory にバインドされた静的配信エンドポイント
    return env.ASSETS.fetch(request);
  },
};
