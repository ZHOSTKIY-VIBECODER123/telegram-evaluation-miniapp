import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  return (
    <div className="max-w-[430px] mx-auto p-4 space-y-4">
      <header className="py-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Настройки
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Параметры приложения
        </p>
      </header>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Версия приложения</span>
            <Badge variant="secondary">1.0.0</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">База данных</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Supabase
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Платформа</span>
            <Badge variant="secondary">Telegram Mini App</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Для изменения сотрудников и чек-листов обращайтесь к администратору
            системы.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
