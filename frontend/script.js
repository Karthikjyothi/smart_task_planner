document.addEventListener('DOMContentLoaded', () => {
    const goalInput = document.getElementById('goal-input');
    const generateBtn = document.getElementById('generate-plan-btn');
    const planOutput = document.getElementById('plan-output');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    
    // The backend API endpoint URL
    const API_URL = 'http://127.0.0.1:5000/plan';

    const generatePlan = async () => {
        const goal = goalInput.value.trim();
        if (!goal) {
            showError("Please enter a goal.");
            return;
        }

        // Show loader and hide previous results
        loader.classList.remove('hidden');
        planOutput.innerHTML = '';
        errorMessage.classList.add('hidden');
        generateBtn.disabled = true;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ goal: goal }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            displayPlan(data.tasks);

        } catch (error) {
            showError(`Failed to generate plan: ${error.message}`);
        } finally {
            // Hide loader and re-enable button
            loader.classList.add('hidden');
            generateBtn.disabled = false;
        }
    };

    const displayPlan = (tasks) => {
        if (!tasks || tasks.length === 0) {
            planOutput.innerHTML = '<p>No tasks were generated for this goal.</p>';
            return;
        }

        planOutput.innerHTML = '<h2>Your Action Plan</h2>';
        
        tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';

            const dependenciesText = task.dependencies.length > 0 
                ? `Dependencies: Task #${task.dependencies.join(', #')}` 
                : 'No dependencies';

            taskCard.innerHTML = `
                <h3>${task.id}. ${task.task_name}</h3>
                <p>${task.description}</p>
                <div class="meta">
                    <span><strong>Timeline:</strong> ${task.timeline_days} day(s)</span>
                    <span><strong>${dependenciesText}</strong></span>
                </div>
            `;
            planOutput.appendChild(taskCard);
        });
    };
    
    const showError = (message) => {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    };

    generateBtn.addEventListener('click', generatePlan);
    
    // Allow pressing Enter to generate plan
    goalInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            generatePlan();
        }
    });
});