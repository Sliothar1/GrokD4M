"use server";

import { redirect } from "next/navigation";
import {
  approveOpenMemory,
  rejectOpenItem,
  saveEditorProposal,
  StoreNotConfiguredError,
} from "@/lib/corrections/store";
import { editorPasswordConfigured, editorUnlocked, unlockEditor } from "@/lib/editorGate";

async function requireEditor() {
  if (!editorPasswordConfigured() || !(await editorUnlocked())) redirect("/editor");
}

export async function loginEditor(formData: FormData) {
  if (!editorPasswordConfigured()) redirect("/editor");
  const attempt = String(formData.get("password") ?? "");
  const ok = await unlockEditor(attempt);
  redirect(ok ? "/editor" : "/editor?denied=1");
}

export async function approveMemoryAction(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("id") ?? "");
  try {
    await approveOpenMemory(id);
  } catch (error) {
    const message = error instanceof StoreNotConfiguredError ? "store" : "failed";
    redirect(`/editor?notice=${message}`);
  }
  redirect("/editor?notice=approved");
}

export async function rejectQueueAction(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("id") ?? "");
  try {
    await rejectOpenItem(id);
  } catch (error) {
    const message = error instanceof StoreNotConfiguredError ? "store" : "failed";
    redirect(`/editor?notice=${message}`);
  }
  redirect("/editor?notice=rejected");
}

export async function proposeChangeAction(formData: FormData) {
  await requireEditor();
  const entity = String(formData.get("entity") ?? "");
  const action = String(formData.get("action") ?? "");
  const target = String(formData.get("target") ?? "").trim().slice(0, 160);
  const note = String(formData.get("note") ?? "").trim().slice(0, 4000);
  if (
    (entity !== "player" && entity !== "game" && entity !== "clipping") ||
    (action !== "create" && action !== "update" && action !== "delete") ||
    target.length < 2 ||
    note.length < 10
  ) {
    redirect("/editor?notice=invalid");
  }
  try {
    await saveEditorProposal({ entity, action, target, note });
  } catch (error) {
    const message = error instanceof StoreNotConfiguredError ? "store" : "failed";
    redirect(`/editor?notice=${message}`);
  }
  redirect("/editor?notice=queued");
}
