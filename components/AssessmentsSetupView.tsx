
import React, { useState } from 'react';
import { AlertTriangle, Plus, Settings, FileQuestion, Trash2, Edit2, Search, ArrowLeft, Save, CheckSquare, Paperclip, MessageSquare, Sparkles, Loader2, ArrowRight, Percent, PenTool, Layout, GripVertical } from 'lucide-react';
import { ScoringSetup, QuestionnaireTemplate, Question, ScoringRange, Section } from '../types';
import { analyzeQuestionAI, QuestionAnalysisResult } from '../services/geminiService';
import Modal from './Modal';

const MOCK_SCORING_SETUPS: ScoringSetup[] = [
  { 
      id: 'SS-01', 
      name: 'Academic Grading Standard', 
      description: 'Standard 5-point grading scale (A-F) used for maturity assessments.', 
      ranges: [
          { label: 'A', min: 90, max: 100, color: 'bg-green-100 text-green-800' },
          { label: 'B', min: 80, max: 89, color: 'bg-blue-100 text-blue-800' },
          { label: 'C', min: 70, max: 79, color: 'bg-yellow-100 text-yellow-800' },
          { label: 'D', min: 60, max: 69, color: 'bg-orange-100 text-orange-800' },
          { label: 'F', min: 0, max: 59, color: 'bg-red-100 text-red-800' },
      ]
  },
  { 
      id: 'SS-02', 
      name: 'Regulatory Compliance', 
      description: 'Binary compliance check for mandatory government regulations.', 
      ranges: [
          { label: 'Compliant', min: 75, max: 100, color: 'bg-green-100 text-green-800' },
          { label: 'Non-Compliant', min: 0, max: 74, color: 'bg-red-100 text-red-800' },
      ]
  },
];

const SIG_LITE_RESPONSE_SET = ['Implemented', 'Partially Implemented', 'Not Implemented', 'Not Applicable'];

const SIG_LITE_SECTIONS: Section[] = [
  {
    id: 'S1',
    name: 'A. Risk Management',
    questions: [
      { id: 'Q1', text: 'Does the organization maintain an Information Security Program?', weight: 10, responseSet: SIG_LITE_RESPONSE_SET, requiresEvidence: true },
      { id: 'Q2', text: 'Is there a designated official responsible for Information Security?', weight: 8, responseSet: SIG_LITE_RESPONSE_SET, requiresEvidence: false },
    ]
  },
  {
    id: 'S2',
    name: 'B. Security Policy',
    questions: [
      { id: 'Q3', text: 'Are information security policies and procedures documented and reviewed annually?', weight: 9, responseSet: SIG_LITE_RESPONSE_SET, requiresEvidence: true },
    ]
  },
  {
    id: 'S3',
    name: 'C. Asset Management',
    questions: [
      { id: 'Q4', text: 'Is there an asset inventory of all critical information assets?', weight: 7, responseSet: SIG_LITE_RESPONSE_SET, requiresEvidence: false },
    ]
  },
  {
    id: 'S4',
    name: 'D. Access Control',
    questions: [
      { id: 'Q5', text: 'Is access restricted based on the principle of "Need to Know" / Least Privilege?', weight: 10, responseSet: SIG_LITE_RESPONSE_SET, requiresEvidence: true },
      { id: 'Q6', text: 'Are access rights reviewed at periodic intervals (e.g. quarterly)?', weight: 9, responseSet: SIG_LITE_RESPONSE_SET, requiresEvidence: true },
    ]
  },
  {
    id: 'S5',
    name: 'E. Physical Security',
    questions: [
      { id: 'Q7', text: 'Are physical security controls in place to protect facilities and data centers?', weight: 5, responseSet: SIG_LITE_RESPONSE_SET, requiresEvidence: false },
    ]
  },
  {
    id: 'S6',
    name: 'F. Operations Security',
    questions: [
      { id: 'Q8', text: 'Are data backups performed regularly and tested for restoration?', weight: 10, responseSet: SIG_LITE_RESPONSE_SET, requiresEvidence: true },
    ]
  },
  {
    id: 'S7',
    name: 'G. Incident Management',
    questions: [
      { id: 'Q9', text: 'Is there a documented Incident Response Plan?', weight: 10, responseSet: SIG_LITE_RESPONSE_SET, requiresEvidence: true },
    ]
  },
  {
    id: 'S8',
    name: 'H. Compliance',
    questions: [
      { id: 'Q10', text: 'Does the organization comply with applicable privacy laws (GDPR, CCPA)?', weight: 10, responseSet: SIG_LITE_RESPONSE_SET, requiresEvidence: true },
    ]
  },
];

const MOCK_QUESTIONNAIRES: QuestionnaireTemplate[] = [
  { 
      id: 'QT-01', 
      name: 'SIG Lite 2024', 
      scoringSetupId: 'SS-01', 
      scoringSetupName: 'Academic Grading Standard', 
      questionCount: 10, 
      status: 'Published', 
      lastUpdated: '2024-01-15', 
      sections: SIG_LITE_SECTIONS
  },
  { 
      id: 'QT-02', 
      name: 'GDPR Readiness Check', 
      scoringSetupId: 'SS-02', 
      scoringSetupName: 'Regulatory Compliance', 
      questionCount: 0, 
      status: 'Draft', 
      lastUpdated: '2024-03-10',
      sections: []
  },
];

const AssessmentsSetupView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scoring' | 'questionnaires'>('scoring');
  const [scoringSetups, setScoringSetups] = useState<ScoringSetup[]>(MOCK_SCORING_SETUPS);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireTemplate[]>(MOCK_QUESTIONNAIRES);
  
  // Designer Mode State
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  
  // AI Analysis State
  const [analyzingQuestionId, setAnalyzingQuestionId] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Record<string, QuestionAnalysisResult>>({});

  // Question Edit State
  const [editingQuestion, setEditingQuestion] = useState<{sectionId: string, question: Question} | null>(null);
  const [questionForm, setQuestionForm] = useState<Partial<Question>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'scoring' | 'questionnaire'>('scoring');
  
  // Form Data
  const [scoringFormData, setScoringFormData] = useState<Partial<ScoringSetup>>({ name: '', description: '', ranges: [] });
  const [questionnaireFormData, setQuestionnaireFormData] = useState<Partial<QuestionnaireTemplate>>({ id: '', name: '', scoringSetupId: '', status: 'Draft' });

  const editingTemplate = questionnaires.find(q => q.id === editingTemplateId);

  // --- Handlers ---

  const handleOpenScoringModal = (setup?: ScoringSetup) => {
      setModalType('scoring');
      if (setup) {
          setScoringFormData({ ...setup });
      } else {
          setScoringFormData({ 
              name: '', 
              description: '', 
              ranges: [
                  { label: 'Pass', min: 50, max: 100, color: 'bg-green-100 text-green-800' },
                  { label: 'Fail', min: 0, max: 49, color: 'bg-red-100 text-red-800' }
              ] 
          });
      }
      setIsModalOpen(true);
  };

  const handleOpenQuestionnaireModal = (template?: QuestionnaireTemplate) => {
      setModalType('questionnaire');
      if (template) {
          setQuestionnaireFormData({ 
              id: template.id,
              name: template.name, 
              scoringSetupId: template.scoringSetupId,
              status: template.status
          });
      } else {
          setQuestionnaireFormData({ 
              id: '',
              name: '', 
              scoringSetupId: scoringSetups[0]?.id || '',
              status: 'Draft'
          });
      }
      setIsModalOpen(true);
  };

  const handleSaveScoring = () => {
      if (!scoringFormData.name) return;
      
      if (scoringFormData.id) {
          setScoringSetups(prev => prev.map(s => s.id === scoringFormData.id ? { ...s, ...scoringFormData } as ScoringSetup : s));
      } else {
          const newSetup: ScoringSetup = {
              id: `SS-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
              name: scoringFormData.name,
              description: scoringFormData.description || '',
              ranges: scoringFormData.ranges || []
          };
          setScoringSetups(prev => [...prev, newSetup]);
      }
      setIsModalOpen(false);
  };

  const handleSaveQuestionnaire = () => {
      if (!questionnaireFormData.name || !questionnaireFormData.scoringSetupId) return;
      
      const scoringSetup = scoringSetups.find(s => s.id === questionnaireFormData.scoringSetupId);
      
      if (questionnaireFormData.id) {
          setQuestionnaires(prev => prev.map(q => q.id === questionnaireFormData.id ? { 
              ...q, 
              name: questionnaireFormData.name!,
              scoringSetupId: questionnaireFormData.scoringSetupId!,
              scoringSetupName: scoringSetup?.name || '',
              status: questionnaireFormData.status as any
          } : q));
      } else {
          const newQ: QuestionnaireTemplate = {
              id: `QT-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
              name: questionnaireFormData.name!,
              scoringSetupId: questionnaireFormData.scoringSetupId!,
              scoringSetupName: scoringSetup?.name || '',
              questionCount: 0,
              status: (questionnaireFormData.status as any) || 'Draft',
              lastUpdated: new Date().toISOString().split('T')[0],
              questions: []
          };
          setQuestionnaires(prev => [...prev, newQ]);
      }
      setIsModalOpen(false);
  };

  const handleAddRange = () => {
      const currentRanges = scoringFormData.ranges || [];
      setScoringFormData({
          ...scoringFormData,
          ranges: [...currentRanges, { label: 'New Range', min: 0, max: 0, color: 'bg-slate-100 text-slate-800' }]
      });
  };

  const handleUpdateRange = (index: number, field: keyof ScoringRange, value: any) => {
      const currentRanges = [...(scoringFormData.ranges || [])];
      currentRanges[index] = { ...currentRanges[index], [field]: value };
      setScoringFormData({ ...scoringFormData, ranges: currentRanges });
  };

  const handleDeleteRange = (index: number) => {
      const currentRanges = [...(scoringFormData.ranges || [])];
      currentRanges.splice(index, 1);
      setScoringFormData({ ...scoringFormData, ranges: currentRanges });
  };

  // --- Question Refinement Handlers ---

  const handleUpdateQuestion = (sectionId: string, questionId: string, updates: Partial<Question>) => {
      if (!editingTemplateId) return;
      
      setQuestionnaires(prev => prev.map(q => {
          if (q.id === editingTemplateId && q.sections) {
              const updatedSections = q.sections.map(s => 
                  s.id === sectionId ? { ...s, questions: s.questions.map(quest => 
                      quest.id === questionId ? { ...quest, ...updates } : quest
                  )} : s
              );
              return { ...q, sections: updatedSections };
          }
          return q;
      }));
  };

  const handleAnalyzeQuestion = async (question: Question) => {
      setAnalyzingQuestionId(question.id);
      const result = await analyzeQuestionAI(question.text, question.weight);
      if (result) {
          setAnalysisResults(prev => ({...prev, [question.id]: result}));
      }
      setAnalyzingQuestionId(null);
  };

  const handleApplyAnalysis = (questionId: string) => {
      const result = analysisResults[questionId];
      if (result) {
          handleUpdateQuestion(questionId, {
              text: result.refinedText,
              weight: result.suggestedWeight
          });
          // Clear result after applying
          const newResults = { ...analysisResults };
          delete newResults[questionId];
          setAnalysisResults(newResults);
      }
  };

  const handleDiscardAnalysis = (questionId: string) => {
      const newResults = { ...analysisResults };
      delete newResults[questionId];
      setAnalysisResults(newResults);
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<Section>) => {
      if (!editingTemplateId) return;
      
      setQuestionnaires(prev => prev.map(q => {
          if (q.id === editingTemplateId && q.sections) {
              const updatedSections = q.sections.map(s => 
                  s.id === sectionId ? { ...s, ...updates } : s
              );
              return { ...q, sections: updatedSections };
          }
          return q;
      }));
  };

  const handleDeleteSection = (sectionId: string) => {
      if (!editingTemplateId || !confirm('Are you sure you want to delete this section and all its questions?')) return;
      
      setQuestionnaires(prev => prev.map(q => {
          if (q.id === editingTemplateId && q.sections) {
              const updatedSections = q.sections.filter(s => s.id !== sectionId);
              const totalQuestions = updatedSections.reduce((sum, s) => sum + s.questions.length, 0);
              return { ...q, sections: updatedSections, questionCount: totalQuestions };
          }
          return q;
      }));
  };

  const handleAddQuestion = (sectionId: string) => {
      if (!editingTemplateId) return;
      
      const newQuestion: Question = {
          id: `Q${Date.now()}`,
          text: 'New Question',
          weight: 5,
          responseSet: SIG_LITE_RESPONSE_SET,
          requiresEvidence: false
      };
      
      setQuestionnaires(prev => prev.map(q => {
          if (q.id === editingTemplateId && q.sections) {
              const updatedSections = q.sections.map(s => 
                  s.id === sectionId ? { ...s, questions: [...s.questions, newQuestion] } : s
              );
              const totalQuestions = updatedSections.reduce((sum, sec) => sum + sec.questions.length, 0);
              return { ...q, sections: updatedSections, questionCount: totalQuestions };
          }
          return q;
      }));
  };

  const handleDeleteQuestion = (sectionId: string, questionId: string) => {
      if (!editingTemplateId || !confirm('Are you sure you want to delete this question?')) return;
      
      setQuestionnaires(prev => prev.map(q => {
          if (q.id === editingTemplateId && q.sections) {
              const updatedSections = q.sections.map(s => 
                  s.id === sectionId ? { ...s, questions: s.questions.filter(q => q.id !== questionId) } : s
              );
              const totalQuestions = updatedSections.reduce((sum, sec) => sum + sec.questions.length, 0);
              return { ...q, sections: updatedSections, questionCount: totalQuestions };
          }
          return q;
      }));
  };

  const handleReorderQuestions = (sectionId: string, fromIndex: number, toIndex: number) => {
      if (!editingTemplateId) return;
      
      setQuestionnaires(prev => prev.map(q => {
          if (q.id === editingTemplateId && q.sections) {
              const updatedSections = q.sections.map(s => {
                  if (s.id === sectionId) {
                      const questions = [...s.questions];
                      const [removed] = questions.splice(fromIndex, 1);
                      questions.splice(toIndex, 0, removed);
                      return { ...s, questions };
                  }
                  return s;
              });
              return { ...q, sections: updatedSections };
          }
          return q;
      }));
  };

  const handleSaveQuestion = () => {
      if (!editingQuestion || !questionForm) return;
      handleUpdateQuestion(editingQuestion.sectionId, editingQuestion.question.id, questionForm);
      setEditingQuestion(null);
      setQuestionForm({});
  };

  const handleAddNewSection = () => {
      if (!editingTemplate) return;
      const newSection: Section = {
          id: `S${Date.now()}`,
          name: 'New Section',
          questions: [
              {
                  id: `Q${Date.now()}`,
                  text: 'New Question',
                  weight: 5,
                  responseSet: SIG_LITE_RESPONSE_SET,
                  requiresEvidence: false
              }
          ]
      };
      const updatedSections = [...editingTemplate.sections, newSection];
      const totalQuestions = updatedSections.reduce((sum, s) => sum + s.questions.length, 0);
      setQuestionnaires(prev => prev.map(q => q.id === editingTemplateId ? { ...q, sections: updatedSections, questionCount: totalQuestions } : q));
  };

  if (editingTemplateId && editingTemplate && editingTemplate.sections) {
      // --- DESIGNER VIEW ---
      return (
          <div className="space-y-6 animate-fade-in pb-20">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                      <button onClick={() => { setEditingTemplateId(null); setEditingQuestion(null); setQuestionForm({}); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                          <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                          <h2 className="text-xl font-bold text-slate-900">{editingTemplate.name} <span className="text-sm font-normal text-slate-400">/ Designer</span></h2>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{editingTemplate.scoringSetupName}</span>
                              <span>•</span>
                              <span>{editingTemplate.questionCount} Questions</span>
                              <span>•</span>
                              <span>Status: {editingTemplate.status}</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          Preview
                      </button>
                      <button 
                        onClick={() => { setEditingTemplateId(null); setEditingQuestion(null); setQuestionForm({}); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                      >
                          <Save className="w-4 h-4" /> Save & Close
                      </button>
                  </div>
              </div>

              {/* Designer Canvas */}
              <div className="bg-slate-50 min-h-[600px] rounded-xl border border-slate-200 p-8">
                  <div className="max-w-4xl mx-auto space-y-8">
                      {editingTemplate.sections.map((section) => (
                          <div key={section.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                      <Layout className="w-4 h-4 text-slate-400"/> {section.name}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                      <button onClick={() => { const newName = prompt('New section name', section.name); if (newName) handleUpdateSection(section.id, { name: newName }); }} className="text-indigo-600 hover:text-indigo-800 text-xs">Edit</button>
                                      <button onClick={() => handleAddQuestion(section.id)} className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1 font-bold">
                                          <Plus className="w-3 h-3" /> Add Question
                                      </button>
                                      <button onClick={() => handleDeleteSection(section.id)} className="text-red-600 hover:text-red-800 text-xs">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                              <div className="divide-y divide-slate-100">
                                  {section.questions.map((q, idx) => (
                                      <div 
                                          key={q.id} 
                                          className="p-6 hover:bg-slate-50 transition-colors group"
                                          draggable
                                          onDragStart={(e) => e.dataTransfer.setData('text/plain', `${section.id}:${q.id}`)}
                                          onDragOver={(e) => e.preventDefault()}
                                          onDrop={(e) => {
                                              const data = e.dataTransfer.getData('text/plain');
                                              const [draggedSectionId, draggedQId] = data.split(':');
                                              if (draggedSectionId === section.id && draggedQId !== q.id) {
                                                  const draggedIndex = section.questions.findIndex(qq => qq.id === draggedQId);
                                                  handleReorderQuestions(section.id, draggedIndex, idx);
                                              }
                                          }}
                                      >
                                          <div className="flex justify-between items-start mb-4">
                                              <div className="flex gap-3 w-full">
                                                  <GripVertical className="w-4 h-4 text-slate-300 mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"/>
                                                  <span className="text-xs font-bold text-slate-400 mt-1">Q{idx + 1}</span>
                                                  <div className="w-full mr-4">
                                                      <p className="font-medium text-slate-800 text-sm leading-relaxed">{q.text}</p>
                                                      
                                                      {/* AI Analysis Result Panel */}
                                                      {analysisResults[q.id] && (
                                                          <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-4 animate-fade-in shadow-sm">
                                                              <div className="flex items-center gap-2 mb-2">
                                                                  <Sparkles className="w-4 h-4 text-indigo-600" />
                                                                  <span className="text-xs font-bold text-indigo-800 uppercase">AI Suggestion</span>
                                                              </div>
                                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                                                                  <div>
                                                                      <span className="text-xs text-slate-400 font-bold uppercase">Original</span>
                                                                      <p className="text-slate-500 line-through text-xs mt-1">{q.text}</p>
                                                                  </div>
                                                                  <div>
                                                                      <span className="text-xs text-indigo-400 font-bold uppercase">Refined</span>
                                                                      <p className="text-indigo-900 font-medium text-sm mt-1">{analysisResults[q.id].refinedText}</p>
                                                                  </div>
                                                              </div>
                                                              <div className="mb-3">
                                                                  <div className="flex items-center gap-2">
                                                                      <span className="text-xs text-slate-500">Suggested Weight: <span className="font-bold text-slate-900">{analysisResults[q.id].suggestedWeight}</span> (Current: {q.weight})</span>
                                                                  </div>
                                                                  <p className="text-xs text-slate-500 mt-1 italic">"{analysisResults[q.id].reasoning}"</p>
                                                              </div>
                                                              <div className="flex gap-2">
                                                                  <button 
                                                                    onClick={() => handleApplyAnalysis(q.id)}
                                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                                                  >
                                                                      Apply Changes
                                                                  </button>
                                                                  <button 
                                                                    onClick={() => handleDiscardAnalysis(q.id)}
                                                                    className="text-slate-500 hover:bg-slate-100 px-3 py-1 rounded text-xs font-medium transition-colors"
                                                                  >
                                                                      Discard
                                                                  </button>
                                                              </div>
                                                          </div>
                                                      )}
                                                  </div>
                                              </div>
                                              <div className="flex items-center gap-4 flex-shrink-0">
                                                  <button 
                                                    onClick={() => handleAnalyzeQuestion(q)}
                                                    disabled={analyzingQuestionId === q.id || !!analysisResults[q.id]}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                                                        analysisResults[q.id] 
                                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-400 cursor-default'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm'
                                                    }`}
                                                    title="Analyze with AI"
                                                  >
                                                      {analyzingQuestionId === q.id ? (
                                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                                      ) : (
                                                          <Sparkles className="w-3.5 h-3.5" />
                                                      )}
                                                      <span className="text-xs font-medium">AI Analyze</span>
                                                  </button>
                                                  
                                                  <div className="flex flex-col items-end w-12">
                                                      <span className="text-[10px] uppercase text-slate-400 font-bold">Weight</span>
                                                      <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{q.weight}</span>
                                                  </div>
                                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <button onClick={() => { setEditingQuestion({sectionId: section.id, question: q}); setQuestionForm(q); }} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4"/></button>
                                                      <button onClick={() => handleDeleteQuestion(section.id, q.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          {/* Response Preview Area */}
                                          <div className="ml-8 bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-4">
                                              <div>
                                                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Response</label>
                                                  <select className="w-full max-w-xs border border-slate-300 rounded text-sm px-2 py-1.5 text-slate-600 bg-white">
                                                      <option value="">-- Select Response --</option>
                                                      {q.responseSet.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                  </select>
                                              </div>
                                              
                                              <div className="grid grid-cols-2 gap-4">
                                                  <div>
                                                      <label className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase mb-1">
                                                          <Paperclip className="w-3 h-3"/> Evidence {q.requiresEvidence && <span className="text-red-500">*</span>}
                                                      </label>
                                                      <div className="border border-dashed border-slate-300 rounded bg-white p-2 text-center text-xs text-slate-400 cursor-pointer hover:bg-slate-50">
                                                          Click to upload or drag files
                                                      </div>
                                                  </div>
                                                  <div>
                                                      <label className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase mb-1">
                                                          <MessageSquare className="w-3 h-3"/> Notes / Comments
                                                      </label>
                                                      <textarea 
                                                          className="w-full border border-slate-300 rounded bg-white px-2 py-1 text-xs h-[34px] resize-none"
                                                          placeholder="Add additional context..."
                                                      ></textarea>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                      
                      <button onClick={handleAddNewSection} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex flex-col items-center gap-2">
                          <Plus className="w-6 h-6"/>
                          <span className="font-medium text-sm">Add New Question Section</span>
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- STANDARD SETUP VIEW ---
  return (
    <div className="space-y-6 animate-fade-in">
       {/* Page Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-900">Assessments Setup</h2>
           <p className="text-sm text-slate-500">Configure scoring frameworks and assessment questionnaires.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => { 
                    if(activeTab === 'scoring') handleOpenScoringModal();
                    else handleOpenQuestionnaireModal(); 
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
                <Plus className="w-4 h-4" />
                New {activeTab === 'scoring' ? 'Scoring Setup' : 'Questionnaire'}
            </button>
        </div>
      </div>

      {/* Warning Alert */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-orange-800">
              <span className="font-bold block mb-1">Caution</span>
              You must create the scoring setup before you create the questionnaire for the assessment because you must select the scoring setup as part of the questionnaire configuration.
          </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-2 shadow-sm mt-6">
          <nav className="flex space-x-6">
            <button
                onClick={() => setActiveTab('scoring')}
                className={`py-4 px-2 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'scoring' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <Settings className="w-4 h-4"/>
                Scoring Setups
            </button>
            <button
                onClick={() => setActiveTab('questionnaires')}
                className={`py-4 px-2 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'questionnaires' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <FileQuestion className="w-4 h-4"/>
                Questionnaires
            </button>
          </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200 min-h-[400px]">
          
          {activeTab === 'scoring' && (
              <div>
                  <div className="p-6 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Scoring Frameworks</h3>
                      <p className="text-sm text-slate-500">
                          Define scoring dimensions and value ranges (e.g. A-F, Compliant/Non-Compliant) used to calculate assessment results.
                      </p>
                  </div>
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                          <tr>
                              <th className="px-6 py-4">Name</th>
                              <th className="px-6 py-4">Description</th>
                              <th className="px-6 py-4">Score Ranges</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {scoringSetups.map(setup => (
                              <tr key={setup.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 font-medium text-slate-900">{setup.name}</td>
                                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{setup.description}</td>
                                  <td className="px-6 py-4">
                                      <div className="flex flex-wrap gap-2">
                                          {setup.ranges.map((r, i) => (
                                              <span key={i} className={`px-2 py-0.5 rounded text-xs border ${r.color ? r.color.replace('text-', 'border-').replace('bg-', 'border-opacity-30 ') : 'bg-slate-100 border-slate-200'}`}>
                                                  {r.label} ({r.min}-{r.max}%)
                                              </span>
                                          ))}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <button onClick={() => handleOpenScoringModal(setup)} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 className="w-4 h-4"/></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}

          {activeTab === 'questionnaires' && (
              <div>
                   <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-4">
                      <div>
                          <h3 className="text-lg font-bold text-slate-800 mb-2">Questionnaire Templates</h3>
                          <p className="text-sm text-slate-500 max-w-3xl">
                              Defines the questions that assessors must answer.
                          </p>
                      </div>
                      <button 
                        onClick={() => handleOpenQuestionnaireModal()}
                        className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                      >
                          <Plus className="w-4 h-4"/> Add Questionnaire Template
                      </button>
                  </div>
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                          <tr>
                              <th className="px-6 py-4">Template Name</th>
                              <th className="px-6 py-4">Scoring Model</th>
                              <th className="px-6 py-4">Questions</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Last Updated</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {questionnaires.map(q => (
                              <tr key={q.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 font-medium text-slate-900">{q.name}</td>
                                  <td className="px-6 py-4">
                                      <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">
                                          <Settings className="w-3 h-3 text-slate-400"/>
                                          {q.scoringSetupName}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-600">{q.questionCount}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                          q.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                      }`}>
                                          {q.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-600">{q.lastUpdated}</td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button 
                                            onClick={() => handleOpenQuestionnaireModal(q)}
                                            className="text-slate-400 hover:text-indigo-600 p-1 flex items-center gap-1 hover:bg-indigo-50 rounded"
                                            title="Edit Properties"
                                          >
                                              <Settings className="w-4 h-4"/>
                                          </button>
                                          <button 
                                            onClick={() => setEditingTemplateId(q.id)}
                                            className="text-slate-400 hover:text-indigo-600 p-1 flex items-center gap-1 hover:bg-indigo-50 rounded"
                                            title="Open Designer"
                                          >
                                              <PenTool className="w-4 h-4"/>
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'scoring' ? (scoringFormData.id ? "Edit Scoring Setup" : "New Scoring Setup") : (questionnaireFormData.id ? "Edit Questionnaire" : "New Questionnaire")}
        maxWidth="4xl"
        footer={
            <>
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                <button 
                    onClick={modalType === 'scoring' ? handleSaveScoring : handleSaveQuestionnaire} 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    Save
                </button>
            </>
        }
      >
          <div className="space-y-4">
              {modalType === 'scoring' ? (
                  <>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                          <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={scoringFormData.name}
                            onChange={(e) => setScoringFormData({...scoringFormData, name: e.target.value})}
                            placeholder="e.g. Academic Standard Grading"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                          <textarea 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-20 focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={scoringFormData.description}
                            onChange={(e) => setScoringFormData({...scoringFormData, description: e.target.value})}
                            placeholder="Explain the purpose of this scoring framework..."
                          />
                      </div>
                      <div className="pt-2">
                          <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-2">
                              <span>Score Ranges (Percentage based)</span>
                              <button onClick={handleAddRange} className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1 font-bold">
                                  <Plus className="w-3 h-3"/> Add Range
                              </button>
                          </label>
                          <div className="space-y-2 border border-slate-200 rounded-lg p-2 bg-slate-50 max-h-60 overflow-y-auto">
                              {scoringFormData.ranges?.map((range, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200 shadow-sm">
                                      <input 
                                        type="text" 
                                        className="w-1/3 border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500" 
                                        placeholder="Label (e.g. A)" 
                                        value={range.label}
                                        onChange={(e) => handleUpdateRange(idx, 'label', e.target.value)}
                                      />
                                      <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 rounded px-2">
                                          <input 
                                            type="number" className="w-10 bg-transparent border-none text-center focus:ring-0" 
                                            value={range.min}
                                            onChange={(e) => handleUpdateRange(idx, 'min', parseInt(e.target.value))}
                                          />
                                          <span>-</span>
                                          <input 
                                            type="number" className="w-10 bg-transparent border-none text-center focus:ring-0" 
                                            value={range.max}
                                            onChange={(e) => handleUpdateRange(idx, 'max', parseInt(e.target.value))}
                                          />
                                          <span className="text-slate-400">%</span>
                                      </div>
                                      <select 
                                        className="w-24 border border-slate-300 rounded px-1 py-1 text-xs focus:outline-none"
                                        value={range.color}
                                        onChange={(e) => handleUpdateRange(idx, 'color', e.target.value)}
                                      >
                                          <option value="bg-green-100 text-green-800">Green</option>
                                          <option value="bg-blue-100 text-blue-800">Blue</option>
                                          <option value="bg-yellow-100 text-yellow-800">Yellow</option>
                                          <option value="bg-orange-100 text-orange-800">Orange</option>
                                          <option value="bg-red-100 text-red-800">Red</option>
                                      </select>
                                      <button onClick={() => handleDeleteRange(idx)} className="text-slate-400 hover:text-red-500 ml-auto"><Trash2 className="w-4 h-4"/></button>
                                  </div>
                              ))}
                              {scoringFormData.ranges?.length === 0 && (
                                  <div className="text-center text-xs text-slate-400 py-4">No ranges defined. Add one above.</div>
                              )}
                          </div>
                      </div>
                  </>
              ) : (
                  <>
                   <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Questionnaire Name</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Vendor Security Assessment 2024"
                            value={questionnaireFormData.name}
                            onChange={(e) => setQuestionnaireFormData({...questionnaireFormData, name: e.target.value})}
                        />
                   </div>
                   <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Scoring Setup</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={questionnaireFormData.scoringSetupId}
                            onChange={(e) => setQuestionnaireFormData({...questionnaireFormData, scoringSetupId: e.target.value})}
                        >
                            {scoringSetups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                   </div>
                   <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={questionnaireFormData.status}
                            onChange={(e) => setQuestionnaireFormData({...questionnaireFormData, status: e.target.value as any})}
                        >
                            <option value="Draft">Draft</option>
                            <option value="Published">Published</option>
                            <option value="Archived">Archived</option>
                        </select>
                   </div>
                  </>
              )}
          </div>
      </Modal>
      {editingQuestion && (
        <Modal onClose={() => { setEditingQuestion(null); setQuestionForm({}); }} title="Edit Question">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Question Text</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={3}
                value={questionForm.text || ''}
                onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weight</label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={questionForm.weight || 0}
                onChange={(e) => setQuestionForm({ ...questionForm, weight: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Response Set</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={questionForm.responseSet?.join(',') || ''}
                onChange={(e) => setQuestionForm({ ...questionForm, responseSet: e.target.value.split(',') })}
              >
                <option value="Implemented,Partially Implemented,Not Implemented,Not Applicable">Implemented, Partially Implemented, Not Implemented, Not Applicable</option>
              </select>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={questionForm.requiresEvidence || false}
                  onChange={(e) => setQuestionForm({ ...questionForm, requiresEvidence: e.target.checked })}
                />
                <span className="ml-2 text-sm">Requires Evidence</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditingQuestion(null); setQuestionForm({}); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSaveQuestion} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AssessmentsSetupView;
