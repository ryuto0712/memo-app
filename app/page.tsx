"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Note = {
  id: string
  user_id: string
  title: string
}

export default function Home() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [userId, setUserId] = useState<string | null>(null)

  const [newTitle, setNewTitle] = useState("")
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)

  // ① ログイン状態を取得＆監視
  useEffect(() => {
    const init = async () => {
      console.log("init start")
  
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id ?? null
  
      console.log("uid:", uid)
  
      setUserId(uid)
  
      if (uid) {
        fetchNotes() // ← awaitを外す
      }
    }
  
    init()
  
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (uid) fetchNotes()
      else setNotes([])
    })
  
    return () => sub.subscription.unsubscribe()
  }, [])

  // ② ログインリンク送信（Magic Link）
  const sendMagicLink = async () => {
    setMessage("送信中...")
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setMessage(`エラー: ${error.message}`)
    else setMessage("ログインリンクを送信しました。メールを確認してください。")
  }

  // ③ ログアウト
  const signOut = async () => {
    await supabase.auth.signOut()
    setMessage("")
    setEmail("")
  }

  // ④ 自分のメモ一覧を取得（ここを強化：finallyでloading解除）
  const fetchNotes = async () => {
    console.log("[fetchNotes] start")
    setLoading(true)
    setMessage("")

    try {
      const { data, error } = await supabase
        .from("notes")
        .select("id, user_id, title")
        .order("id", { ascending: false })

      console.log("[fetchNotes] done", { error, data })

      if (error) {
        setMessage(`取得エラー: ${error.message}`)
        return
      }

      setNotes((data ?? []) as Note[])
    } catch (e: any) {
      console.log("[fetchNotes] exception", e)
      setMessage(`取得例外: ${e?.message ?? String(e)}`)
    } finally {
      setLoading(false)
      console.log("[fetchNotes] finally -> loading false")
    }
  }

  // ⑤ メモ保存（user_idはログイン中ユーザーIDを入れる）
  const addNote = async () => {
    console.log("[addNote] clicked", { userId, newTitle })
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

    if (error) {
      setMessage(`保存エラー: ${error.message}`)
      return
    }

    setNewTitle("")
    await fetchNotes()
  }

  // ⑥ 削除
  const deleteNote = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id)
    if (error) setMessage(`削除エラー: ${error.message}`)
    else await fetchNotes()
  }

  // -------------------------
  // UI
  // -------------------------
  if (!userId) {
    return (
      <main style={{ padding: 40 }}>
        <p style={{ color: "green" }}>VERSION_20260226_1208</p>
        <h1>Memo App ログイン</h1>
        <p>メールアドレスにログインリンクを送ります</p>

        <input
          style={{ padding: 8, width: 320 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <button style={{ marginLeft: 8, padding: 8 }} onClick={sendMagicLink}>
          ログインリンク送信
        </button>

        <p style={{ marginTop: 16 }}>{message}</p>
      </main>
    )
  }

  return (
    <main style={{ padding: 40 }}>
      <p style={{ color: "green" }}>VERSION_20260226_1208</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>メモ</h1>
        <button onClick={signOut} style={{ padding: 8 }}>
          ログアウト
        </button>
      </div>

      <p style={{ opacity: 0.7, marginTop: 0 }}>user_id: {userId}</p>

      <div style={{ marginTop: 16 }}>
        <input
          style={{ padding: 8, width: 360 }}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="メモを入力…"
        />
        <button style={{ marginLeft: 8, padding: 8 }} onClick={addNote}>
          保存
        </button>
        <button style={{ marginLeft: 8, padding: 8 }} onClick={fetchNotes}>
          再読み込み
        </button>
      </div>

      <p style={{ marginTop: 16, color: "crimson" }}>{message}</p>

      <h2 style={{ marginTop: 24 }}>一覧</h2>
      {loading ? (
        <p>読み込み中…</p>
      ) : notes.length === 0 ? (
        <p>まだメモがありません</p>
      ) : (
        <ul style={{ marginTop: 12 }}>
          {notes.map((n) => (
            <li key={n.id} style={{ marginBottom: 8 }}>
              {n.title}
              <button style={{ marginLeft: 8 }} onClick={() => deleteNote(n.id)}>
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}