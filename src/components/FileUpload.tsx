"use client";
import { uploadToS3 } from "@/lib/s3";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Inbox, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      file_key,
      file_name,
    }: {
      file_key: string;
      file_name: string;
    }) => {
      const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
      });
      return response.data;
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        //Bigger than 10MBS
        console.log("File too large");
        return;
      }
      try {
        setUploading(true);
        const data = await uploadToS3(file);
        if (!data?.file_key || !data.file_name) {
          console.log("Something went wrong");
          return;
        }
        mutate(data, {
          onSuccess: ({ chat_Id }) => {
            console.log("Chat has been created");
            router.push(`/chat/${chat_Id}`);
          },
          onError: (error) => {
            console.log("Error creating chat");
            console.log("Reason", error.message);
          },
        });
      } catch (error) {
        console.log(error);
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <div className="p-2 bg-white rounded-xl">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
        })}
      >
        <input {...getInputProps()} />
        {uploading || isPending ? (
          <>
            <Loader2 className="w-10 h-10 text-blue-500" />
            <p className="mt-2 text-sm text-slate-400">Analyzing PDF...</p>
          </>
        ) : (
          <>
            <Inbox className="w-10 h-10 text-blue-500" />
            <p className="mt-2 text-sm text-slate-400">
              Drop PDF Here And Start Chatting
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
