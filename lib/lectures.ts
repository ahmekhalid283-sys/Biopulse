import { supabase } from "./supabase";

export interface LectureData {
  chapter_id: string;
  title: string;
  lecture_order: number;
  duration: string;
  youtube_url: string;
  pdf_url: string;
  is_workshop: boolean;
  is_free: boolean;
  is_published: boolean;
}

export async function createLecture(lecture: LectureData) {
  const { data, error } = await supabase
    .from("lectures")
    .insert(lecture)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getLectures() {
  const { data, error } = await supabase
    .from("lectures")
    .select(`
      *,
      chapters(
        id,
        title
      )
    `)
    .order("lecture_order");

  if (error) {
    throw error;
  }

  return data;
}

export async function getLecturesByChapter(chapterId: string) {
  const { data, error } = await supabase
    .from("lectures")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("lecture_order");

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteLecture(id: string) {
  const { error } = await supabase
    .from("lectures")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function updateLecture(
  id: string,
  lecture: Partial<LectureData>
) {
  const { data, error } = await supabase
    .from("lectures")
    .update(lecture)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}