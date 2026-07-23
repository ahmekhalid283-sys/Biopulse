import { supabase } from "./supabase";

export async function uploadPdf(file: File) {
  const extension = file.name.split(".").pop();

  const fileName = `${crypto.randomUUID()}.${extension}`;

  const filePath = `lectures/${fileName}`;

  const { error } = await supabase.storage
    .from("pdfs")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from("pdfs")
    .getPublicUrl(filePath);

  return data.publicUrl;
}