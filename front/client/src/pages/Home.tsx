import { Link } from 'wouter';
import { ArrowRight, PenTool, BookOpen, MessageSquare, Heart, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import ChatBot from '@/components/ChatBot';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ChatBot />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-secondary/5" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              합격을 위한 <span className="text-accent">AI 파트너, JasoS</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              당신의 글쓰기 스타일을 학습하여, 가장 당신다운 자기소개서와 면접 답변을 완성해 드립니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/writing">
                <Button className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg rounded-lg flex items-center gap-2 w-full sm:w-auto justify-center">
                  자기소개서 작성하기 <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/interview">
                <Button variant="outline" className="px-8 py-6 text-lg rounded-lg border-accent text-accent hover:bg-accent/10 w-full sm:w-auto flex items-center gap-2 justify-center">
                  면접질문 예측 <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard
              icon={<BookOpen className="w-8 h-8 text-accent" />}
              title="스타일 학습"
              description="기존에 작성한 글을 분석하여 당신만의 고유한 문체와 스타일을 AI가 학습합니다."
              link="/learning"
            />
            <FeatureCard
              icon={<PenTool className="w-8 h-8 text-accent" />}
              title="자기소개서 생성"
              description="학습된 스타일을 바탕으로 지원 동기, 입사 후 포부 등 맞춤형 자소서를 작성합니다."
              link="/writing"
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8 text-accent" />}
              title="면접 질문 예측"
              description="자소서 내용을 분석하여 나올 수 있는 예상 면접 질문과 답변 가이드를 제공합니다."
              link="/interview"
            />
            <FeatureCard
              icon={<Heart className="w-8 h-8 text-accent" />}
              title="감정분석"
              description="작성한 글의 감정을 분석하여 긍정/부정을 판단하고 더 나은 표현을 제안합니다."
              link="/sentiment"
            />
            <FeatureCard
              icon={<Building2 className="w-8 h-8 text-accent" />}
              title="기업 분석"
              description="지원하려는 기업의 비전, 최신 이슈, 재무 상태 등을 분석하여 지원 전략을 수립합니다."
              link="/corporate"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>&copy; 2024 JasoS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, link }: { icon: React.ReactNode, title: string, description: string, link: string }) {
  return (
    <Link href={link}>
      <div className="p-8 rounded-xl border border-border bg-background hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
        <div className="mb-4 bg-accent/10 w-16 h-16 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}
