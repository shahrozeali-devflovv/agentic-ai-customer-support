"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import AdminHeader from "@/components/admin-header";
import AdminSidebar from "@/components/admin-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";

type KnowledgeDocument = {
  id: number;
  title: string;
  file_name: string;
  file_type: string;
  file_path: string;
  status: "uploaded" | "processing" | "ready" | "failed";
  uploaded_by_user_id: number;
  created_at: string;
  updated_at: string;
};

export default function KnowledgeBasePage() {
  const {
    user,
    token,
    isLoading: isAuthLoading,
  } = useAuth({
    allowedRoles: ["admin"],
  });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [documents, setDocuments] = useState<
    KnowledgeDocument[]
  >([]);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] =
    useState(false);

  const [isFetching, setIsFetching] =
    useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      if (!token) {
        return;
      }

      setIsFetching(true);
      setError("");

      try {
        const data =
          await apiRequest<KnowledgeDocument[]>(
            "/knowledge-documents",
            {
              token,
            },
          );

        setDocuments(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(
            "Could not load knowledge documents",
          );
        }
      } finally {
        setIsFetching(false);
      }
    }

    loadDocuments();
  }, [token]);

  async function handleUpload(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!token) {
      return;
    }

    if (!title.trim()) {
      setError("Please enter a document title");
      return;
    }

    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    setError("");
    setSuccess("");
    setIsUploading(true);

    try {
      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("file", file);

      const uploadedDocument =
        await apiRequest<KnowledgeDocument>(
          "/knowledge-documents",
          {
            method: "POST",
            token,
            body: formData,
          },
        );

      setDocuments((currentDocuments) => [
        uploadedDocument,
        ...currentDocuments,
      ]);

      setTitle("");
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccess(
        "Document uploaded successfully",
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not upload document");
      }
    } finally {
      setIsUploading(false);
    }
  }

  if (isAuthLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-soft-white">
        <p className="text-text-secondary">
          Checking authentication...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-soft-white">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() =>
          setIsSidebarOpen(false)
        }
      />

      <div className="lg:ml-72">
        <AdminHeader
          onMenuClick={() =>
            setIsSidebarOpen(true)
          }
          userName={user.full_name}
        />

        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-dark-green">
              Knowledge Management
            </p>

            <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
              Knowledge Base
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
              Upload trusted support documents that
              will later be processed and used by the
              AI support system.
            </p>
          </section>

          <section className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6">
            <h3 className="text-lg font-bold text-text-primary">
              Upload document
            </h3>

            <p className="mt-2 text-sm text-text-secondary">
              PDF documents are currently supported.
            </p>

            <form
              onSubmit={handleUpload}
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-semibold text-text-primary"
                >
                  Document title
                </label>

                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Return and Refund Policy"
                  required
                  className="w-full rounded-xl border border-border-soft bg-white px-4 py-3 text-sm text-text-primary outline-none transition focus:border-dark-green"
                />
              </div>

              <div>
                <label
                  htmlFor="knowledge-file"
                  className="mb-2 block text-sm font-semibold text-text-primary"
                >
                  PDF file
                </label>

                <input
                  ref={fileInputRef}
                  id="knowledge-file"
                  type="file"
                  accept=".pdf,application/pdf"
                  required
                  onChange={(event) =>
                    setFile(
                      event.target.files?.[0] ??
                        null,
                    )
                  }
                  className="block w-full rounded-xl border border-border-soft bg-white px-3 py-3 text-sm text-text-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-light-green file:px-4 file:py-2 file:font-semibold file:text-dark-green"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-light-green px-4 py-3 text-sm font-semibold text-dark-green">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading}
                className="w-full rounded-xl bg-yellow px-5 py-3 font-bold text-dark-green transition hover:bg-yellow-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isUploading
                  ? "Uploading..."
                  : "Upload PDF"}
              </button>
            </form>
          </section>

          <section className="mt-8 rounded-2xl border border-border-soft bg-white p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  Uploaded documents
                </h3>

                <p className="mt-1 text-sm text-text-secondary">
                  Documents currently stored in the
                  knowledge base.
                </p>
              </div>

              <div className="w-fit rounded-xl bg-soft-yellow px-3 py-2 text-sm font-bold text-dark-green">
                {documents.length} document
                {documents.length === 1 ? "" : "s"}
              </div>
            </div>

            {isFetching ? (
              <p className="text-sm text-text-secondary">
                Loading documents...
              </p>
            ) : documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-soft px-4 py-10 text-center">
                <p className="text-sm text-text-secondary">
                  No knowledge documents uploaded yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {documents.map((document) => (
                  <article
                    key={document.id}
                    className="rounded-2xl border border-border-soft p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h4 className="font-bold text-text-primary">
                          {document.title}
                        </h4>

                        <p className="mt-1 break-all text-sm text-text-secondary">
                          {document.file_name}
                        </p>

                        <p className="mt-3 text-xs text-text-secondary">
                          Uploaded{" "}
                          {new Date(
                            document.created_at,
                          ).toLocaleString()}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-soft-yellow px-3 py-1 text-xs font-bold capitalize text-dark-green">
                        {document.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}