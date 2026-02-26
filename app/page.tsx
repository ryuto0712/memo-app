"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Note = {
  id: string
  user_id: string
  title: string
  created_at?: string
}

export default function Home() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [userId, setUserId] = useState<string | null>(null)

  const [newTitle, setNewTitle] = useState("")
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)

  // 初回：ログイン状態取得
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id ?? null
      setUserId(uid)
      if (uid) await fetchNotes(uid)
    }
    init()
  }, [])

  // ログインリンク送信
  const sendMagicLink = async () => {
    setMessage("")
    if (!email.trim()) {
      setMessage("メールアドレスを入力してください。")
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    })

    if (error) setMessage("エラー: " + error.message)
    else setMessage("ログインリンクを送信しました。メールを確認してください。")
  }

  // ログアウト
  const signOut = async () => {
    await supabase.auth.signOut()
    setUserId(null)
    setNotes([])
    setNewTitle("")
    setMessage("")
  }

  // 一覧取得
  const fetchNotes = async (uid?: string) => {
    const targetUid = uid ?? userId
    if (!targetUid) return

    setLoading(true)
    setMessage("")

    try {
      const { data, error } = await supabase
        .from("notes")
        .select("id, user_id, title, created_at")
        .eq("user_id", targetUid)
        .order("created_at", { ascending: false })

      if (error) {
        setMessage("取得エラー: " + error.message)
        return
      }

      setNotes((data ?? []) as Note[])
    } catch (e: any) {
      setMessage("取得例外: " + (e?.message ?? String(e)))
    } finally {
      setLoading(false)
    }
  }

  // 追加
  const addNote = async () => {
    setMessage("")
    if (!userId) return
    if (!newTitle.trim()) {
      setMessage("メモ内容を入力してください。")
      return
    }

    const { error } = await supabase.from("notes").insert({
      user_id: userId,
      title: newTitle.trim(),
    })

    if (error) setMessage("追加エラー: " + error.message)
    else {
      setNewTitle("")
      await fetchNotes(userId)
    }
  }

  // 削除
  const deleteNote = async (id: string) => {
    setMessage("")
    const { error } = await supabase.from("notes").delete().eq("id", id)
    if (error) setMessage("削除エラー: " + error.message)
    else await fetchNotes(userId ?? undefined)
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-green-600">MEMO-APP</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              {userId ? "メモ" : "ログイン"}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {userId
                ? "自分のメモだけをクラウドに保存します。"
                : "メールに届くリンクでログインします。パスワード不要。"}
            </p>
          </div>

          {userId ? (
            <button
              onClick={signOut}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
            >
              ログアウト
            </button>
          ) : null}
        </div>

        {/* メインカード */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          {/* ログイン画面 */}
          {!userId ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 shadow-sm outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-100"
                />
              </div>

              <button
                onClick={sendMagicLink}
                className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 active:bg-gray-900"
              >
                ログインリンク送信
              </button>

              {message ? (
                <p className="text-sm text-gray-700">{message}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  ※ 迷惑メールフォルダも確認してください。
                </p>
              )}
            </div>
          ) : (
            // メモ画面
            <div className="space-y-6">
              {/* user_id */}
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-200">
                <span className="font-semibold text-gray-900">user_id:</span>{" "}
                {userId}
              </div>

              {/* 入力 */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="メモを入力..."
                  className="w-full flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 shadow-sm outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-100"
                />

                <div className="flex gap-2">
                  <button
                    onClick={addNote}
                    className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => fetchNotes()}
                    className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
                  >
                    再読み込み
                  </button>
                </div>
              </div>

              {/* メッセージ */}
              {message ? (
                <p className="text-sm font-medium text-red-600">{message}</p>
              ) : null}

              {/* 一覧 */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">一覧</h2>
                  <span className="text-xs text-gray-500">
                    {loading ? "読み込み中..." : `${notes.length} 件`}
                  </span>
                </div>

                <div className="mt-3">
                  {loading ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                      読み込み中...
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                      まだメモがありません
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {notes.map((n) => (
                        <li
                          key={n.id}
                          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {n.title}
                            </p>
                            {n.created_at ? (
                              <p className="mt-1 text-xs text-gray-500">
                                {new Date(n.created_at).toLocaleString()}
                              </p>
                            ) : null}
                          </div>

                          <button
                            onClick={() => deleteNote(n.id)}
                            className="ml-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                          >
                            削除
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Built with Next.js + Supabase + Tailwind
        </p>
      </div>
    </main>
  )
}