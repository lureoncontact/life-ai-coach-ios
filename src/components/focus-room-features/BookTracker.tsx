import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, Star } from "lucide-react";

interface BookTrackerProps {
  roomId: string;
}

const BookTracker = ({ roomId }: BookTrackerProps) => {
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [updateBookId, setUpdateBookId] = useState("");
  const [pagesRead, setPagesRead] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadBooks();
  }, [roomId]);

  const loadBooks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("books_read")
      .select("*")
      .eq("focus_room_id", roomId)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (data) setBooks(data);
  };

  const addBook = async () => {
    if (!bookTitle.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ingresa el título del libro",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("books_read").insert({
      user_id: user.id,
      focus_room_id: roomId,
      book_title: bookTitle,
      author: author || null,
      total_pages: totalPages ? parseInt(totalPages) : null,
      pages_read: 0,
      status: "reading",
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar el libro",
      });
      return;
    }

    toast({
      title: "¡Libro agregado! 📚",
      description: bookTitle,
    });

    setBookTitle("");
    setAuthor("");
    setTotalPages("");
    setShowAddForm(false);
    loadBooks();
  };

  const updateProgress = async () => {
    if (!updateBookId || !pagesRead || parseInt(pagesRead) < 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ingresa páginas válidas",
      });
      return;
    }

    const book = books.find(b => b.id === updateBookId);
    if (!book) return;

    const newPagesRead = parseInt(pagesRead);
    const isCompleted = book.total_pages && newPagesRead >= book.total_pages;

    const { error } = await supabase
      .from("books_read")
      .update({
        pages_read: newPagesRead,
        status: isCompleted ? "completed" : "reading",
        completed_date: isCompleted ? new Date().toISOString().split('T')[0] : null,
      })
      .eq("id", updateBookId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar",
      });
      return;
    }

    toast({
      title: isCompleted ? "¡Libro completado! 🎉" : "¡Progreso actualizado! 📖",
      description: `${newPagesRead} páginas leídas`,
    });

    setUpdateBookId("");
    setPagesRead("");
    loadBooks();
  };

  const getProgress = (book: any) => {
    if (!book.total_pages) return 0;
    return Math.min(100, Math.round((book.pages_read / book.total_pages) * 100));
  };

  return (
    <div className="space-y-4 w-full max-w-full">
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-base">
                📚 Biblioteca Personal
              </CardTitle>
              <CardDescription>
                Rastrea tu progreso de lectura
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-interactive"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </CardHeader>
        {showAddForm && (
          <CardContent className="border-t pt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="book-title">Título del Libro *</Label>
              <Input
                id="book-title"
                placeholder="Ej: Hábitos Atómicos"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  placeholder="James Clear"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-pages">Total Páginas</Label>
                <Input
                  id="total-pages"
                  type="number"
                  placeholder="320"
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addBook} className="btn-interactive">
                Agregar
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {books.map((book) => (
        <Card key={book.id} className={book.status === "completed" ? "bg-success/5 border-success/20" : ""}>
          <CardHeader>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{book.book_title}</CardTitle>
                  {book.author && (
                    <CardDescription className="text-sm">
                      por {book.author}
                    </CardDescription>
                  )}
                </div>
                {book.status === "completed" && (
                  <div className="text-success font-medium text-sm">
                    ✓ Completado
                  </div>
                )}
              </div>
              {book.total_pages && (
                <>
                  <Progress value={getProgress(book)} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    {book.pages_read} de {book.total_pages} páginas ({getProgress(book)}%)
                  </div>
                </>
              )}
            </div>
          </CardHeader>
          {book.status !== "completed" && (
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Páginas leídas"
                  value={updateBookId === book.id ? pagesRead : ""}
                  onChange={(e) => {
                    setUpdateBookId(book.id);
                    setPagesRead(e.target.value);
                  }}
                />
                <Button
                  onClick={updateProgress}
                  disabled={updateBookId !== book.id}
                  className="btn-interactive"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {books.length === 0 && !showAddForm && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No has agregado libros aún</p>
            <p className="text-sm">Haz clic en "Nuevo" para comenzar</p>
          </CardContent>
        </Card>
      )}

      {books.filter(b => b.status === "completed").length > 0 && (
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-sm">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {books.filter(b => b.status === "completed").length}
            </div>
            <p className="text-sm text-muted-foreground">
              Libros completados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookTracker;
