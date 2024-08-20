#pragma warning disable SKEXP0001
#pragma warning disable SKEXP0003
#pragma warning disable SKEXP0010
#pragma warning disable SKEXP0011
#pragma warning disable SKEXP0050
#pragma warning disable SKEXP0052

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Microsoft.SemanticKernel.Embeddings;
using Microsoft.SemanticKernel.Memory;
using Microsoft.SemanticKernel.Plugins.Memory;

// Semantic Kernel
var kernelBuilder = Kernel.CreateBuilder();
kernelBuilder.AddOpenAIChatCompletion(modelId: "phi3", endpoint: new Uri("http://localhost:11434"), apiKey: null);
kernelBuilder.AddLocalTextEmbeddingGeneration();
var kernel = kernelBuilder.Build();

var embeddingGenerator = kernel.Services.GetRequiredService<ITextEmbeddingGenerationService>();
var memoryStore = new VolatileMemoryStore();
var memory = new SemanticTextMemory(new VolatileMemoryStore(), embeddingGenerator);
const string MemoryCollectionName = "ragFacts";
var filePath = "KnowledgeBase.txt";
var text = File.ReadAllText(filePath);
var sentences = text.Split('.');
for (int i = 0; i < sentences.Length; i++)
{
    await memory.SaveInformationAsync(MemoryCollectionName, id: $"info{i}", text: sentences[i].Trim());
}
var memoryPlugin = new TextMemoryPlugin(memory);
kernel.ImportPluginFromObject(memoryPlugin);

// Web App
var webAppBuilder = WebApplication.CreateBuilder(args);
webAppBuilder.Services.AddCors(options =>
{
	options.AddPolicy("AllowSpecificOrigin",
		builder =>
		{
			builder.WithOrigins("http://localhost:4200")
				   .AllowAnyHeader()
				   .AllowAnyMethod();
		});
});
webAppBuilder.Services.AddEndpointsApiExplorer();
webAppBuilder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "MyRag", Version = "v1" });

    options.MapType<string>(() => new OpenApiSchema
    {
        Type = "string",
        Example = new OpenApiString("Tell me about your life")
    });
});
webAppBuilder.Services.AddSingleton(kernel);

var app = webAppBuilder.Build();
app.UseCors("AllowSpecificOrigin");
app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();

app.MapGet("/ragAnswer", async (HttpContext context, Kernel ai, string question) =>
{
    var settings = new OpenAIPromptExecutionSettings()
    {
        ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions,
    };

    var prompt = @"
    Question: {{$input}}
    Answer shortly the question in 1 sentence using the memory content: {{Recall}}.";

    var arguments = new KernelArguments(settings)
    {
        { "input", question },
        { "collection", MemoryCollectionName }
    };
    context.Response.ContentType = "text/plain";
    await foreach (var item in kernel.InvokePromptStreamingAsync(prompt, arguments))
    {
        await context.Response.WriteAsync(item.ToString());
    }
})
.WithName("GetAnswer")
.WithOpenApi();

app.Run();