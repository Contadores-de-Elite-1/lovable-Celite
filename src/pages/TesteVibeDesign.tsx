import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, Zap, TrendingUp, Users } from "lucide-react";

export default function TesteVibeDesign() {
  const [activeTab, setActiveTab] = useState("design");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header com animação */}
      <div className="border-b border-purple-500/20 bg-black/40 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              <div>
                <h1 className="text-2xl font-bold text-white">Vibe Design Experiment</h1>
                <p className="text-sm text-purple-300">Explorando novo design/cores/animações</p>
              </div>
            </div>
            <Badge className="bg-purple-500/20 text-purple-200 border border-purple-500/50">
              🚀 Sandbox (sem committar)
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex gap-3 mb-8 border-b border-purple-500/20">
          <button
            onClick={() => setActiveTab("design")}
            className={`px-4 py-2 font-semibold transition-all ${
              activeTab === "design"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            🎨 Design Moderno
          </button>
          <button
            onClick={() => setActiveTab("components")}
            className={`px-4 py-2 font-semibold transition-all ${
              activeTab === "components"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            🧩 Componentes Novos
          </button>
          <button
            onClick={() => setActiveTab("mobile")}
            className={`px-4 py-2 font-semibold transition-all ${
              activeTab === "mobile"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            📱 Responsivo
          </button>
        </div>

        {/* Design Moderno */}
        {activeTab === "design" && (
          <div className="space-y-8">
            {/* Card com gradiente */}
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur hover:border-purple-400/50 transition-all hover:shadow-lg hover:shadow-purple-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      Design 1: Gradient Dark
                    </CardTitle>
                    <CardDescription className="text-purple-300">
                      Fundo escuro com gradiente roxo + azul, cards translúcidos
                    </CardDescription>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/50">
                    MODERNO
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">
                  ✅ Cores: Roxo + Azul (moderno e profissional)
                  <br />
                  ✅ Cards: Translúcidos com backdrop-blur (glassmorphism)
                  <br />
                  ✅ Animações: Hover effects suaves e glow effects
                  <br />
                  ✅ Tipografia: Branco/cinza para contraste
                </p>
                <div className="pt-4 border-t border-purple-500/10">
                  <Button className="bg-purple-600 hover:bg-purple-500">
                    Testar este design
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card com ícones coloridos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: TrendingUp, color: "text-green-400", label: "Performance" },
                { icon: Users, color: "text-blue-400", label: "Comunidade" },
                { icon: Sparkles, color: "text-pink-400", label: "Inovação" },
              ].map((item, i) => (
                <Card
                  key={i}
                  className="border-purple-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur group hover:border-purple-400/50 transition-all cursor-pointer"
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-3">
                      <item.icon className={`w-8 h-8 ${item.color} group-hover:scale-110 transition-transform`} />
                      <h3 className="text-white font-semibold">{item.label}</h3>
                      <p className="text-sm text-gray-400">Card com hover animation</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Componentes Novos */}
        {activeTab === "components" && (
          <div className="space-y-8">
            {/* Form com novo estilo */}
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">🧩 Input Moderno</CardTitle>
                <CardDescription className="text-purple-300">
                  Campo com foco em experiência visual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Teste este input moderno..."
                  className="bg-slate-800/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all h-11"
                />
                <Input
                  placeholder="Com animação on focus..."
                  className="bg-slate-800/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 h-11"
                />
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold h-11">
                  Enviar
                </Button>
              </CardContent>
            </Card>

            {/* Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Comissões", value: 75, color: "from-green-500 to-emerald-500" },
                { name: "Clientes", value: 60, color: "from-blue-500 to-cyan-500" },
                { name: "Performance", value: 90, color: "from-purple-500 to-pink-500" },
                { name: "Satisfação", value: 85, color: "from-orange-500 to-red-500" },
              ].map((item, i) => (
                <Card
                  key={i}
                  className="border-purple-500/20 bg-slate-800/30 backdrop-blur hover:bg-slate-800/50 transition-all"
                >
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">{item.name}</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {item.value}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Responsivo */}
        {activeTab === "mobile" && (
          <div className="space-y-8">
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">📱 Teste Responsivo</CardTitle>
                <CardDescription className="text-purple-300">
                  Abra no celular ou redimensione a janela para testar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mobile Preview */}
                <div className="bg-black rounded-2xl border-8 border-gray-800 shadow-2xl mx-auto w-full max-w-sm p-4">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 space-y-3 aspect-video flex flex-col justify-center">
                    <div className="h-8 bg-purple-500/30 rounded animate-pulse" />
                    <div className="h-4 bg-purple-500/20 rounded w-3/4 animate-pulse" />
                    <div className="space-y-2 mt-4">
                      <div className="h-3 bg-purple-500/20 rounded animate-pulse" />
                      <div className="h-3 bg-purple-500/20 rounded w-5/6 animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button className="bg-purple-600 w-full">Mobile OK</Button>
                  <Button className="bg-blue-600 w-full">Desktop OK</Button>
                </div>

                <div className="bg-slate-800/30 rounded-lg p-4 text-sm text-gray-300 space-y-2">
                  <p>✅ Grid responsivo (1 coluna mobile, 2+ desktop)</p>
                  <p>✅ Texto ajustável com tailwind breakpoints</p>
                  <p>✅ Botões full-width em mobile, auto em desktop</p>
                  <p>✅ Padding adaptativo</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer com info */}
      <div className="border-t border-purple-500/20 bg-black/40 backdrop-blur-lg mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-400">
          <p>
            🔬 Esta é uma página de EXPERIMENTAÇÃO. Mudanças aqui NÃO são commitadas automaticamente.
          </p>
          <p className="mt-2">
            Se gostar do design → Me avisa para integrar nas páginas reais! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}
