import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gebfslqgsferneqtiyux.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYmZzbHFnc2Zlcm5lcXRpeXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDIwNjUsImV4cCI6MjA2ODYxODA2NX0.1AkrTF6XbWrCaHuU_NjQ_I6Gu2Xf47-bGd4Ub0OmdDY';
export const supabase = createClient(supabaseUrl, supabaseKey);
