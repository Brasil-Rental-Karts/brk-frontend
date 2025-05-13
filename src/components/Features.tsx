import { Card } from "@/components/ui/card"
import { Trophy, BarChart2, Calendar } from "lucide-react"
import { motion } from "framer-motion"

const FEATURES = [
  { 
    title: "Gestão de Ligas", 
    desc: "Ferramentas profissionais para organização de campeonatos",
    icon: Trophy
  },
  { 
    title: "Rankings", 
    desc: "Sistema de pontuação unificado",
    icon: BarChart2
  },
  { 
    title: "Calendário", 
    desc: "Centralização de eventos nacionais",
    icon: Calendar
  }
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export function Features() {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">Recursos Principais</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa para gerenciar e acompanhar o kartismo brasileiro
          </p>
        </motion.div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div key={feature.title} variants={item} className="h-full">
                <Card 
                  className="p-8 hover:border-primary-500 transition-all duration-300 hover:shadow-lg h-full flex flex-col items-center text-center"
                >
                  <Icon className="h-10 w-10 text-primary-500 mb-6 flex-shrink-0" />
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
} 