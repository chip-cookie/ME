<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { CheckCircle2, ChevronRight, ChevronLeft, Send, Building2, User, FileText } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';

    let step = $state(1);
    let isSubmitting = $state(false);
    let isSuccess = $state(false);

    let formData = $state({
        companyName: '',
        companySize: '',
        industry: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        projectScope: '',
        projectTimeline: '',
        budgetRange: '',
        challenges: '',
        goals: '',
    });

    const steps = [
        { id: 1, title: 'Company', icon: Building2 },
        { id: 2, title: 'Contact', icon: User },
        { id: 3, title: 'Project', icon: FileText }
    ];

    async function handleSubmit() {
        if (step < 3) {
            step++;
            return;
        }

        isSubmitting = true;
        try {
            await trpc($page).leadInquiries.create.mutate(formData);
            isSuccess = true;
        } catch (error) {
            alert('제출에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="container-px py-24 md:py-32 flex flex-col justify-center">
    <div class="max-w-xl mx-auto w-full">
        <!-- Header -->
        <div class="text-center mb-12">
            <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                Get in <span class="text-indigo-600">Touch</span>
            </h1>
            <p class="text-gray-500 font-medium">프로젝트에 대해 알려주세요. 최고의 전략을 제안해 드립니다.</p>
        </div>

        {#if isSuccess}
            <div class="bg-white rounded-[2.5rem] p-12 text-center shadow-xl shadow-gray-200 border border-gray-100" in:fly={{ y: 20 }}>
                <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
                    <CheckCircle2 class="w-10 h-10" />
                </div>
                <h2 class="text-2xl font-black text-gray-900 mb-4">제출이 완료되었습니다!</h2>
                <p class="text-gray-500 mb-10 leading-relaxed font-medium">
                    소중한 정보를 남겨주셔서 감사합니다. <br />
                    24시간 이내에 담당자가 연락드리겠습니다.
                </p>
                <a href="/" class="inline-flex items-center justify-center px-10 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all">
                    홈으로 돌아가기
                </a>
            </div>
        {:else}
            <!-- Progress Bar -->
            <div class="flex items-center justify-between mb-12 px-2">
                {#each steps as s, i}
                    <div class="flex flex-col items-center gap-2 relative">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 z-10
                                    {step >= s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-300 border border-gray-100'}">
                            <s.icon class="w-5 h-5" />
                        </div>
                        <span class="text-[10px] font-black uppercase tracking-widest {step >= s.id ? 'text-indigo-600' : 'text-gray-300'}">
                            {s.title}
                        </span>
                        
                        {#if i < steps.length - 1}
                            <div class="absolute top-5 left-10 w-[calc(100%+2rem)] h-0.5 bg-gray-100 -z-0">
                                <div class="h-full bg-indigo-600 transition-all duration-500" style="width: {step > s.id ? '100%' : '0%'}"></div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>

            <!-- Form -->
            <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-gray-200 border border-gray-100 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-16 -mt-16"></div>

                <div class="relative z-10">
                    {#if step === 1}
                        <div in:fade={{ duration: 200 }} class="space-y-6">
                            <h2 class="text-2xl font-black text-gray-900 mb-8 tracking-tight">Company Information</h2>
                            <div>
                                <label for="companyName" class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Company Name</label>
                                <input id="companyName" bind:value={formData.companyName} required type="text" placeholder="Enter company name" 
                                       class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium" />
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label for="companySize" class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Company Size</label>
                                    <select id="companySize" bind:value={formData.companySize} class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium">
                                        <option value="">Select Size</option>
                                        <option value="1-50">1-50 employees</option>
                                        <option value="51-200">51-200 employees</option>
                                        <option value="201-1000">201-1000 employees</option>
                                        <option value="1000+">1000+ employees</option>
                                    </select>
                                </div>
                                <div>
                                    <label for="industry" class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Industry</label>
                                    <select id="industry" bind:value={formData.industry} class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium">
                                        <option value="">Select Industry</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    {:else if step === 2}
                        <div in:fade={{ duration: 200 }} class="space-y-6">
                            <h2 class="text-2xl font-black text-gray-900 mb-8 tracking-tight">Contact Information</h2>
                            <div>
                                <label for="contactName" class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Your Name</label>
                                <input id="contactName" bind:value={formData.contactName} required type="text" placeholder="Enter your full name" 
                                       class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium" />
                            </div>
                            <div>
                                <label for="contactEmail" class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                                <input id="contactEmail" bind:value={formData.contactEmail} required type="email" placeholder="you@company.com" 
                                       class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium" />
                            </div>
                            <div>
                                <label for="contactPhone" class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                                <input id="contactPhone" bind:value={formData.contactPhone} type="tel" placeholder="010-0000-0000" 
                                       class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium" />
                            </div>
                        </div>
                    {:else if step === 3}
                        <div in:fade={{ duration: 200 }} class="space-y-6">
                            <h2 class="text-2xl font-black text-gray-900 mb-8 tracking-tight">Project Details</h2>
                            <div>
                                <label for="projectScope" class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Project Scope</label>
                                <textarea id="projectScope" bind:value={formData.projectScope} rows="4" placeholder="프로젝트에 대해 간략히 설명해 주세요." 
                                          class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium resize-none"></textarea>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label for="projectTimeline" class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Timeline</label>
                                    <select id="projectTimeline" bind:value={formData.projectTimeline} class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium">
                                        <option value="">Select Timeline</option>
                                        <option value="0-3 months">0-3 months</option>
                                        <option value="3-6 months">3-6 months</option>
                                        <option value="6-12 months">6-12 months</option>
                                    </select>
                                </div>
                                <div>
                                    <label for="budgetRange" class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Budget Range</label>
                                    <select id="budgetRange" bind:value={formData.budgetRange} class="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium">
                                        <option value="">Select Budget</option>
                                        <option value="$1k-$5k">$1k-$5k</option>
                                        <option value="$5k-$10k">$5k-$10k</option>
                                        <option value="$10k+">$10k+</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Footer / Buttons -->
                    <div class="mt-12 flex gap-4">
                        {#if step > 1}
                            <button type="button" onclick={() => step--} class="flex-1 px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                                <ChevronLeft class="w-5 h-5" />
                                BACK
                            </button>
                        {/if}
                        <button type="submit" disabled={isSubmitting} class="flex-[2] px-8 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200">
                            {#if isSubmitting}
                                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                SENDING...
                            {:else}
                                {step === 3 ? 'SUBMIT REQUEST' : 'CONTINUE'}
                                {#if step < 3}
                                    <ChevronRight class="w-5 h-5" />
                                {:else}
                                    <Send class="w-4 h-4 ml-1" />
                                {/if}
                            {/if}
                        </button>
                    </div>
                </div>
            </form>
        {/if}
    </div>
</div>
